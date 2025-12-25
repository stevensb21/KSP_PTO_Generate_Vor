from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from .models import (
    WorkCategory, WorkType, Work, Resource,
    WorkTypeWork, WorkResource
)


# ==================== INLINE КЛАССЫ ====================

class WorkResourceInline(admin.TabularInline):
    """Inline для ресурсов работы в типе работ"""
    model = WorkResource
    extra = 1
    fields = ['resource', 'quantity_per_unit']
    verbose_name = "Ресурс"
    verbose_name_plural = "Ресурсы для работы"
    autocomplete_fields = ['resource']


class WorkTypeWorkInline(admin.StackedInline):
    """Inline для работ в типе работ"""
    model = WorkTypeWork
    extra = 1
    fields = ['work', 'order_index', 'work_volume_per_unit', 'view_resources_link']
    readonly_fields = ['view_resources_link']
    verbose_name = "Работа"
    verbose_name_plural = "Работы в типе работ"
    autocomplete_fields = ['work']
    
    def view_resources_link(self, obj):
        """Ссылка на ресурсы для этой работы"""
        if obj.pk:
            url = reverse('admin:reference_workresource_changelist')
            count = WorkResource.objects.filter(work_type=obj.work_type, work=obj.work).count()
            if count > 0:
                return format_html(
                    '<a href="{}?work_type__id__exact={}&work__id__exact={}" '
                    'style="color: #ffc107; font-weight: bold;">📦 Ресурсы: {}</a>',
                    url, obj.work_type.id, obj.work.id, count
                )
            return format_html(
                '<a href="{}?work_type__id__exact={}&work__id__exact={}" '
                'style="color: #999;">➕ Добавить ресурсы</a>',
                url, obj.work_type.id, obj.work.id
            )
        return format_html('<span style="color: #999;">Сначала сохраните работу</span>')
    view_resources_link.short_description = "Ресурсы"


# ==================== АДМИН-ПАНЕЛЬ ДЛЯ ВИДОВ РАБОТ ====================

@admin.register(WorkCategory)
class WorkCategoryAdmin(admin.ModelAdmin):
    """Админ-панель для видов работ (Полы, Кровля, Стены и т.д.)"""
    list_display = ['id', 'name', 'work_types_count', 'view_work_types_link']
    search_fields = ['name']
    list_display_links = ['name']
    ordering = ['name']
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('name',)
        }),
    )
    
    def work_types_count(self, obj):
        """Количество типов работ в этом виде"""
        count = obj.work_types.count()
        return format_html(
            '<span style="font-weight: bold; color: #0066cc;">{}</span>',
            count
        )
    work_types_count.short_description = "Типов работ"
    
    def view_work_types_link(self, obj):
        """Ссылка на типы работ этого вида"""
        count = obj.work_types.count()
        if count > 0:
            url = reverse('admin:reference_worktype_changelist')
            return format_html(
                '<a href="{}?category__id__exact={}" style="color: #0066cc;">Просмотреть типы работ</a>',
                url, obj.id
            )
        return "-"
    view_work_types_link.short_description = "Действия"


# ==================== АДМИН-ПАНЕЛЬ ДЛЯ ТИПОВ РАБОТ ====================

@admin.register(WorkType)
class WorkTypeAdmin(admin.ModelAdmin):
    """Админ-панель для типов работ с inline-редактированием работ и ресурсов"""
    list_display = ['id', 'category', 'name', 'works_count', 'resources_count', 'full_path']
    list_filter = ['category']
    search_fields = ['name', 'category__name']
    list_display_links = ['name']
    ordering = ['category', 'name']
    autocomplete_fields = ['category']
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('category', 'name'),
            'description': 'Тип работ - это шаблон со списком работ и ресурсов'
        }),
    )
    
    inlines = [WorkTypeWorkInline]
    
    def works_count(self, obj):
        """Количество работ в типе работ"""
        count = obj.work_type_works.count()
        return format_html(
            '<span style="font-weight: bold; color: #28a745;">{}</span>',
            count
        )
    works_count.short_description = "Работ"
    
    def resources_count(self, obj):
        """Количество уникальных ресурсов в типе работ"""
        count = obj.work_resources.values('resource').distinct().count()
        return format_html(
            '<span style="font-weight: bold; color: #ffc107;">{}</span>',
            count
        )
    resources_count.short_description = "Ресурсов"
    
    def full_path(self, obj):
        """Полный путь: Вид работ → Тип работ"""
        return format_html(
            '<strong>{}</strong> → <em>{}</em>',
            obj.category.name, obj.name
        )
    full_path.short_description = "Путь"


# ==================== АДМИН-ПАНЕЛЬ ДЛЯ РАБОТ ====================

@admin.register(Work)
class WorkAdmin(admin.ModelAdmin):
    """Админ-панель для работ"""
    list_display = ['id', 'name', 'unit', 'work_types_count', 'usage_info']
    search_fields = ['name', 'unit']
    list_display_links = ['name']
    ordering = ['name']
    list_filter = ['unit']
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('name', 'unit'),
            'description': 'Работа - это конкретная операция, которая выполняется (например, Устройство стяжки)'
        }),
    )
    
    def work_types_count(self, obj):
        """Количество типов работ, использующих эту работу"""
        count = obj.work_type_works.values('work_type').distinct().count()
        if count > 0:
            url = reverse('admin:reference_worktype_changelist')
            return format_html(
                '<a href="{}?work_type_works__work__id__exact={}" style="color: #0066cc; font-weight: bold;">{}</a>',
                url, obj.id, count
            )
        return format_html('<span style="color: #999;">0</span>')
    work_types_count.short_description = "Используется в типах работ"
    
    def usage_info(self, obj):
        """Информация об использовании работы"""
        work_type_works = obj.work_type_works.select_related('work_type', 'work_type__category')
        if work_type_works.exists():
            categories = {}
            for wtw in work_type_works[:5]:  # Показываем первые 5
                cat_name = wtw.work_type.category.name
                if cat_name not in categories:
                    categories[cat_name] = []
                categories[cat_name].append(wtw.work_type.name)
            
            result = []
            for cat, types in list(categories.items())[:3]:  # Показываем первые 3 категории
                types_str = ', '.join(types[:2])  # Первые 2 типа
                if len(types) > 2:
                    types_str += f' (+{len(types)-2})'
                result.append(f"<strong>{cat}</strong>: {types_str}")
            
            return format_html('<br>'.join(result))
        return format_html('<span style="color: #999;">Не используется</span>')
    usage_info.short_description = "Где используется"


# ==================== АДМИН-ПАНЕЛЬ ДЛЯ РЕСУРСОВ ====================

@admin.register(Resource)
class ResourceAdmin(admin.ModelAdmin):
    """Админ-панель для ресурсов"""
    list_display = ['id', 'name', 'unit', 'work_types_count', 'usage_info']
    search_fields = ['name', 'unit']
    list_display_links = ['name']
    ordering = ['name']
    list_filter = ['unit']
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('name', 'unit'),
            'description': 'Ресурс - это материал или компонент, используемый в работах (например, Песок, Сухая смесь)'
        }),
    )
    
    def work_types_count(self, obj):
        """Количество типов работ, использующих этот ресурс"""
        count = obj.work_resources.values('work_type').distinct().count()
        if count > 0:
            url = reverse('admin:reference_worktype_changelist')
            return format_html(
                '<a href="{}?work_resources__resource__id__exact={}" style="color: #0066cc; font-weight: bold;">{}</a>',
                url, obj.id, count
            )
        return format_html('<span style="color: #999;">0</span>')
    work_types_count.short_description = "Используется в типах работ"
    
    def usage_info(self, obj):
        """Информация об использовании ресурса"""
        work_resources = obj.work_resources.select_related('work_type', 'work_type__category', 'work')
        if work_resources.exists():
            info = []
            for wr in work_resources[:5]:  # Показываем первые 5
                info.append(
                    f"<strong>{wr.work_type.category.name}</strong> → "
                    f"{wr.work_type.name} → {wr.work.name} "
                    f"({wr.quantity_per_unit} {obj.unit})"
                )
            return format_html('<br>'.join(info))
        return format_html('<span style="color: #999;">Не используется</span>')
    usage_info.short_description = "Где используется"


# ==================== АДМИН-ПАНЕЛЬ ДЛЯ РАБОТ В ТИПАХ РАБОТ ====================

@admin.register(WorkTypeWork)
class WorkTypeWorkAdmin(admin.ModelAdmin):
    """Админ-панель для связи работ с типами работ"""
    list_display = ['id', 'work_type_link', 'work_link', 'order_index', 'work_volume_display', 'resources_count']
    list_filter = ['work_type__category', 'work_type']
    search_fields = ['work_type__name', 'work_type__category__name', 'work__name']
    list_display_links = ['work_link']
    ordering = ['work_type', 'order_index']
    autocomplete_fields = ['work_type', 'work']
    
    fieldsets = (
        ('Связь', {
            'fields': ('work_type', 'work'),
            'description': 'Связь типа работ с конкретной работой'
        }),
        ('Параметры', {
            'fields': ('order_index', 'work_volume_per_unit'),
            'description': '⚠️ Объем работы на единицу типа работ (например, 0.1 м³ стяжки на 1 м² типа работ)'
        }),
    )
    
    
    def work_type_link(self, obj):
        """Ссылка на тип работ"""
        url = reverse('admin:reference_worktype_change', args=[obj.work_type.id])
        return format_html(
            '<a href="{}"><strong>{}</strong> ({})</a>',
            url, obj.work_type.name, obj.work_type.category.name
        )
    work_type_link.short_description = "Тип работ"
    
    def work_link(self, obj):
        """Ссылка на работу"""
        url = reverse('admin:reference_work_change', args=[obj.work.id])
        return format_html(
            '<a href="{}">{}</a>',
            url, obj.work.name
        )
    work_link.short_description = "Работа"
    
    def work_volume_display(self, obj):
        """Отображение объема работы с единицей измерения"""
        return format_html(
            '<strong style="color: #28a745;">{} {}</strong>',
            obj.work_volume_per_unit, obj.work.unit
        )
    work_volume_display.short_description = "Объем на единицу"
    
    def resources_count(self, obj):
        """Количество ресурсов для этой работы в этом типе работ"""
        count = obj.work_type.work_resources.filter(work=obj.work).count()
        if count > 0:
            url = reverse('admin:reference_workresource_changelist')
            return format_html(
                '<a href="{}?work_type__id__exact={}&work__id__exact={}" style="color: #ffc107; font-weight: bold;">{} ресурсов</a>',
                url, obj.work_type.id, obj.work.id, count
            )
        return format_html('<span style="color: #999;">Нет ресурсов</span>')
    resources_count.short_description = "Ресурсы"


# ==================== АДМИН-ПАНЕЛЬ ДЛЯ РЕСУРСОВ РАБОТ ====================

@admin.register(WorkResource)
class WorkResourceAdmin(admin.ModelAdmin):
    """Админ-панель для связи ресурсов с работами в типах работ"""
    list_display = ['id', 'work_type_link', 'work_link', 'resource_link', 'quantity_display']
    list_filter = ['work_type__category', 'work_type', 'work', 'resource']
    search_fields = ['work_type__name', 'work__name', 'resource__name']
    list_display_links = ['resource_link']
    ordering = ['work_type', 'work', 'resource']
    autocomplete_fields = ['work_type', 'work', 'resource']
    
    fieldsets = (
        ('Связь', {
            'fields': ('work_type', 'work', 'resource'),
            'description': 'Связь ресурса с работой в конкретном типе работ'
        }),
        ('Параметры', {
            'fields': ('quantity_per_unit',),
            'description': '⚠️ Количество ресурса на единицу работы (зависит от типа работ!)'
        }),
    )
    
    
    def work_type_link(self, obj):
        """Ссылка на тип работ"""
        url = reverse('admin:reference_worktype_change', args=[obj.work_type.id])
        return format_html(
            '<a href="{}"><strong>{}</strong> ({})</a>',
            url, obj.work_type.name, obj.work_type.category.name
        )
    work_type_link.short_description = "Тип работ"
    
    def work_link(self, obj):
        """Ссылка на работу"""
        url = reverse('admin:reference_work_change', args=[obj.work.id])
        return format_html(
            '<a href="{}">{}</a>',
            url, obj.work.name
        )
    work_link.short_description = "Работа"
    
    def resource_link(self, obj):
        """Ссылка на ресурс"""
        url = reverse('admin:reference_resource_change', args=[obj.resource.id])
        return format_html(
            '<a href="{}"><strong>{}</strong></a>',
            url, obj.resource.name
        )
    resource_link.short_description = "Ресурс"
    
    def quantity_display(self, obj):
        """Отображение количества с единицей измерения"""
        return format_html(
            '<strong style="color: #ffc107;">{} {}</strong> на 1 {}',
            obj.quantity_per_unit, obj.resource.unit, obj.work.unit
        )
    quantity_display.short_description = "Количество на единицу"
