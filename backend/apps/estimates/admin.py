from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from .models import (
    Estimate, EstimateSection, EstimateSectionWorkType,
    EstimateItem, EstimateItemResource
)


class EstimateItemResourceInline(admin.TabularInline):
    """Ресурсы для работы в ВОР (автоматически рассчитываются)"""
    model = EstimateItemResource
    extra = 0
    fields = ['resource', 'quantity']
    readonly_fields = ['quantity']
    verbose_name = "Ресурс"
    verbose_name_plural = "Ресурсы работы (из шаблона типа работ)"
    can_delete = False


class EstimateItemInline(admin.TabularInline):
    """Работы в типе работ (автоматически создаются из шаблона)"""
    model = EstimateItem
    extra = 0
    fields = ['work', 'volume']
    readonly_fields = ['volume', 'work']
    verbose_name = "Работа"
    verbose_name_plural = "Работы (из шаблона типа работ)"
    can_delete = False


class EstimateSectionWorkTypeInline(admin.StackedInline):
    """Типы работ в разделе с процентом"""
    model = EstimateSectionWorkType
    extra = 1
    fields = ['work_type', 'percentage']
    verbose_name = "Тип работ"
    verbose_name_plural = "Типы работ в разделе (укажите процент от площади)"
    autocomplete_fields = ['work_type']
    
    def get_queryset(self, request):
        """Оптимизация запросов"""
        qs = super().get_queryset(request)
        return qs.select_related('work_type', 'work_type__category')


class EstimateSectionInline(admin.StackedInline):
    """Виды работ в ВОР с площадью"""
    model = EstimateSection
    extra = 1
    fields = ['work_category', 'total_area']
    verbose_name = "Вид работ"
    verbose_name_plural = "Виды работ в ВОР (укажите площадь в м²)"
    autocomplete_fields = ['work_category']
    show_change_link = True


@admin.register(Estimate)
class EstimateAdmin(admin.ModelAdmin):
    """ВОР - Ведомость Объёмов Работ"""
    list_display = ['id', 'name', 'object_name', 'status', 'sections_count', 'works_count', 'resources_count', 'created_at', 'view_works_link', 'view_resources_link']
    list_filter = ['status', 'created_at']
    search_fields = ['name', 'object_name']
    list_display_links = ['name']
    inlines = [EstimateSectionInline]
    readonly_fields = ['created_at']
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('name', 'object_name', 'status'),
            'description': 'Создайте ВОР для конкретного объекта. Затем добавьте виды работ (Полы, Кровля и т.д.) с площадью.'
        }),
        ('Системная информация', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    def sections_count(self, obj):
        """Количество видов работ в ВОР"""
        count = obj.sections.count()
        return format_html(
            '<span style="font-weight: bold; color: #0066cc;">{} видов работ</span>',
            count
        )
    sections_count.short_description = "Видов работ"
    
    def works_count(self, obj):
        """Количество работ в ВОР"""
        from .models import EstimateItem
        count = EstimateItem.objects.filter(
            section_work_type__section__estimate=obj
        ).count()
        return format_html(
            '<span style="font-weight: bold; color: #28a745;">{} работ</span>',
            count
        )
    works_count.short_description = "Работ"
    
    def resources_count(self, obj):
        """Количество ресурсов в ВОР"""
        from .models import EstimateItemResource
        count = EstimateItemResource.objects.filter(
            estimate_item__section_work_type__section__estimate=obj
        ).count()
        return format_html(
            '<span style="font-weight: bold; color: #ffc107;">{} ресурсов</span>',
            count
        )
    resources_count.short_description = "Ресурсов"
    
    def view_works_link(self, obj):
        """Ссылка на просмотр всех работ ВОР"""
        url = reverse('admin:estimates_estimateitem_changelist')
        return format_html(
            '<a href="{}?section_work_type__section__estimate__id__exact={}" '
            'style="color: #28a745; font-weight: bold;">📋 Все работы</a>',
            url, obj.id
        )
    view_works_link.short_description = "Просмотр работ"
    
    def view_resources_link(self, obj):
        """Ссылка на просмотр всех ресурсов ВОР"""
        url = reverse('admin:estimates_estimateitemresource_changelist')
        return format_html(
            '<a href="{}?estimate_item__section_work_type__section__estimate__id__exact={}" '
            'style="color: #ffc107; font-weight: bold;">📦 Все ресурсы</a>',
            url, obj.id
        )
    view_resources_link.short_description = "Просмотр ресурсов"


@admin.register(EstimateSection)
class EstimateSectionAdmin(admin.ModelAdmin):
    """Вид работ в ВОР (Полы, Кровля, Стены и т.д.) с площадью"""
    list_display = ['id', 'estimate_link', 'work_category', 'total_area_display', 'work_types_count']
    list_filter = ['work_category', 'estimate']
    search_fields = ['estimate__name', 'work_category__name']
    list_display_links = ['work_category']
    inlines = [EstimateSectionWorkTypeInline]
    autocomplete_fields = ['estimate', 'work_category']
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('estimate', 'work_category', 'total_area'),
            'description': '⚠️ Укажите вид работ (Полы, Кровля и т.д.) и общую площадь раздела в м²'
        }),
    )
    
    def estimate_link(self, obj):
        """Ссылка на ВОР"""
        url = reverse('admin:estimates_estimate_change', args=[obj.estimate.id])
        return format_html(
            '<a href="{}"><strong>{}</strong></a>',
            url, obj.estimate.name
        )
    estimate_link.short_description = "ВОР"
    
    def total_area_display(self, obj):
        """Отображение площади"""
        return format_html(
            '<strong style="color: #28a745;">{} м²</strong>',
            obj.total_area
        )
    total_area_display.short_description = "Площадь"
    
    def work_types_count(self, obj):
        """Количество типов работ в разделе"""
        count = obj.work_types.count()
        total_percentage = sum(wt.percentage for wt in obj.work_types.all())
        color = '#28a745' if abs(total_percentage - 100) < 0.01 else '#dc3545'
        return format_html(
            '<span style="font-weight: bold; color: {};">{} типов ({}%)</span>',
            color, count, total_percentage
        )
    work_types_count.short_description = "Типов работ"


@admin.register(EstimateSectionWorkType)
class EstimateSectionWorkTypeAdmin(admin.ModelAdmin):
    """Тип работ в разделе ВОР с процентом"""
    list_display = ['id', 'section_link', 'work_type_link', 'percentage_display', 'items_count']
    list_filter = ['section__work_category', 'work_type']
    search_fields = ['section__estimate__name', 'work_type__name']
    list_display_links = ['work_type_link']
    inlines = [EstimateItemInline]
    autocomplete_fields = ['section', 'work_type']
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('section', 'work_type', 'percentage'),
            'description': '⚠️ Выберите тип работ из шаблона и укажите процент от площади раздела. Работы и ресурсы создадутся автоматически из шаблона типа работ.'
        }),
    )
    
    
    def section_link(self, obj):
        """Ссылка на раздел"""
        url = reverse('admin:estimates_estimatesection_change', args=[obj.section.id])
        return format_html(
            '<a href="{}"><strong>{}</strong> - {} ({} м²)</a>',
            url, obj.section.estimate.name, obj.section.work_category.name, obj.section.total_area
        )
    section_link.short_description = "Раздел ВОР"
    
    def work_type_link(self, obj):
        """Ссылка на тип работ"""
        url = reverse('admin:reference_worktype_change', args=[obj.work_type.id])
        return format_html(
            '<a href="{}"><strong>{}</strong> ({})</a>',
            url, obj.work_type.name, obj.work_type.category.name
        )
    work_type_link.short_description = "Тип работ (шаблон)"
    
    def percentage_display(self, obj):
        """Отображение процента"""
        return format_html(
            '<strong style="color: #ffc107; font-size: 16px;">{}%</strong>',
            obj.percentage
        )
    percentage_display.short_description = "Процент"
    
    def items_count(self, obj):
        """Количество работ в типе"""
        count = obj.items.count()
        return format_html(
            '<span style="font-weight: bold; color: #28a745;">{} работ</span>',
            count
        )
    items_count.short_description = "Работ"


@admin.register(EstimateItem)
class EstimateItemAdmin(admin.ModelAdmin):
    """Работа в ВОР (создается автоматически из шаблона типа работ)"""
    list_display = ['id', 'work_link', 'estimate_link', 'section_work_type_link', 'volume_display']
    list_filter = [
        'section_work_type__section__estimate',  # Фильтр по ВОР
        'section_work_type__section__work_category', 
        'work'
    ]
    search_fields = [
        'section_work_type__section__estimate__name', 
        'section_work_type__section__estimate__object_name',
        'work__name'
    ]
    list_display_links = ['work_link']
    inlines = [EstimateItemResourceInline]
    readonly_fields = ['section_work_type', 'work', 'volume']
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('section_work_type', 'work', 'volume'),
            'description': '🤖 Работа создается автоматически из шаблона типа работ. Объем рассчитывается автоматически.'
        }),
    )
    
    def has_add_permission(self, request):
        """Запрещаем ручное создание - только через шаблон"""
        return False
    
    def work_link(self, obj):
        """Ссылка на работу"""
        url = reverse('admin:reference_work_change', args=[obj.work.id])
        return format_html(
            '<a href="{}"><strong>{}</strong> ({})</a>',
            url, obj.work.name, obj.work.unit
        )
    work_link.short_description = "Работа"
    
    def estimate_link(self, obj):
        """Ссылка на ВОР"""
        url = reverse('admin:estimates_estimate_change', args=[obj.section_work_type.section.estimate.id])
        return format_html(
            '<a href="{}"><strong>{}</strong></a>',
            url, obj.section_work_type.section.estimate.name
        )
    estimate_link.short_description = "ВОР"
    
    def section_work_type_link(self, obj):
        """Ссылка на тип работ в разделе"""
        url = reverse('admin:estimates_estimatesectionworktype_change', args=[obj.section_work_type.id])
        return format_html(
            '<a href="{}">{} - {} ({}%)</a>',
            url,
            obj.section_work_type.section.work_category.name,
            obj.section_work_type.work_type.name,
            obj.section_work_type.percentage
        )
    section_work_type_link.short_description = "Тип работ в разделе"
    
    def volume_display(self, obj):
        """Отображение объема"""
        return format_html(
            '<strong style="color: #28a745; font-size: 16px;">{} {}</strong>',
            obj.volume, obj.work.unit
        )
    volume_display.short_description = "Объем"


@admin.register(EstimateItemResource)
class EstimateItemResourceAdmin(admin.ModelAdmin):
    """Ресурс для работы в ВОР (создается автоматически из шаблона)"""
    list_display = ['id', 'resource_link', 'estimate_link', 'estimate_item_link', 'quantity_display']
    list_filter = [
        'estimate_item__section_work_type__section__estimate',  # Фильтр по ВОР
        'resource', 
        'estimate_item__section_work_type__section__work_category'
    ]
    search_fields = [
        'estimate_item__section_work_type__section__estimate__name',
        'estimate_item__section_work_type__section__estimate__object_name',
        'resource__name', 
        'estimate_item__work__name'
    ]
    list_display_links = ['resource_link']
    readonly_fields = ['estimate_item', 'resource', 'quantity']
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('estimate_item', 'resource', 'quantity'),
            'description': '🤖 Ресурс создается автоматически из шаблона типа работ. Количество рассчитывается автоматически.'
        }),
    )
    
    def has_add_permission(self, request):
        """Запрещаем ручное создание - только через шаблон"""
        return False
    
    def resource_link(self, obj):
        """Ссылка на ресурс"""
        url = reverse('admin:reference_resource_change', args=[obj.resource.id])
        return format_html(
            '<a href="{}"><strong>{}</strong> ({})</a>',
            url, obj.resource.name, obj.resource.unit
        )
    resource_link.short_description = "Ресурс"
    
    def estimate_link(self, obj):
        """Ссылка на ВОР"""
        url = reverse('admin:estimates_estimate_change', args=[obj.estimate_item.section_work_type.section.estimate.id])
        return format_html(
            '<a href="{}"><strong>{}</strong></a>',
            url, obj.estimate_item.section_work_type.section.estimate.name
        )
    estimate_link.short_description = "ВОР"
    
    def estimate_item_link(self, obj):
        """Ссылка на работу"""
        url = reverse('admin:estimates_estimateitem_change', args=[obj.estimate_item.id])
        return format_html(
            '<a href="{}"><strong>{}</strong></a>',
            url, obj.estimate_item.work.name
        )
    estimate_item_link.short_description = "Работа"
    
    def quantity_display(self, obj):
        """Отображение количества"""
        return format_html(
            '<strong style="color: #ffc107; font-size: 16px;">{} {}</strong>',
            obj.quantity, obj.resource.unit
        )
    quantity_display.short_description = "Количество"
