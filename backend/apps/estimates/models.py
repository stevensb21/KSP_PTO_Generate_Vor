from django.db import models
from django.db import transaction
from apps.reference.models import WorkCategory, WorkType, Work, Resource, WorkTypeWork, WorkResource


class Estimate(models.Model):
    """
    ВОР - Ведомость Объёмов Работ
    Конкретная ведомость для конкретного объекта
    Содержит разделы по видам работ (Полы, Кровля, Стены и т.д.)
    """
    STATUS_CHOICES = [
        ('draft', 'Черновик'),
        ('active', 'Активна'),
        ('completed', 'Завершена'),
        ('archived', 'Архив'),
    ]

    name = models.CharField(max_length=255, verbose_name="Название ВОР")
    object_name = models.CharField(max_length=255, verbose_name="Название объекта")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='draft',
        verbose_name="Статус"
    )

    class Meta:
        verbose_name = "ВОР"
        verbose_name_plural = "ВОР"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.object_name})"


class EstimateSection(models.Model):
    """
    РАЗДЕЛ_ВОР - Раздел ВОР по виду работ
    Например: Полы, Кровля, Стены
    ⚠️ Пользователь вписывает общую площадь раздела
    """
    estimate = models.ForeignKey(
        Estimate,
        on_delete=models.CASCADE,
        related_name='sections',
        verbose_name="ВОР"
    )
    work_category = models.ForeignKey(
        WorkCategory,
        on_delete=models.PROTECT,
        related_name='estimate_sections',
        verbose_name="Вид работ"
    )
    total_area = models.FloatField(
        verbose_name="Общая площадь раздела (м²)",
        help_text="Общая площадь раздела в квадратных метрах"
    )

    class Meta:
        verbose_name = "Вид работ в ВОР"
        verbose_name_plural = "Виды работ в ВОР"
        ordering = ['estimate', 'work_category']
        unique_together = [['estimate', 'work_category']]

    def __str__(self):
        return f"{self.estimate.name} - {self.work_category.name} ({self.total_area} м²)"
    
    def save(self, *args, **kwargs):
        """Пересчет объемов при изменении площади"""
        is_new = self.pk is None
        if not is_new:
            # Получаем старую площадь для пересчета
            old_instance = EstimateSection.objects.get(pk=self.pk)
            if old_instance.total_area != self.total_area:
                # Площадь изменилась - пересчитываем все объемы
                self._recalculate_volumes()
        super().save(*args, **kwargs)
    
    def _recalculate_volumes(self):
        """Пересчет объемов работ и количества ресурсов при изменении площади"""
        for work_type in self.work_types.all():
            work_type._recalculate_items()


class EstimateSectionWorkType(models.Model):
    """
    РАЗДЕЛ_ВОР_ТИП_РАБОТ - Тип работ в разделе ВОР
    ⚠️ Пользователь вписывает процент для каждого типа работ в разделе
    """
    section = models.ForeignKey(
        EstimateSection,
        on_delete=models.CASCADE,
        related_name='work_types',
        verbose_name="Раздел ВОР"
    )
    work_type = models.ForeignKey(
        WorkType,
        on_delete=models.PROTECT,
        related_name='estimate_section_work_types',
        verbose_name="Тип работ"
    )
    percentage = models.FloatField(
        verbose_name="Процент от площади раздела",
        help_text="Процент площади раздела, который занимает данный тип работ (сумма должна быть 100%)"
    )

    class Meta:
        verbose_name = "Тип работ в разделе ВОР"
        verbose_name_plural = "Типы работ в разделах ВОР"
        ordering = ['section', '-percentage']
        unique_together = [['section', 'work_type']]

    def __str__(self):
        return f"{self.section.work_category.name} - {self.work_type.name} ({self.percentage}%)"
    
    def save(self, *args, **kwargs):
        """Пересчет объемов при изменении процента или создании нового типа работ"""
        is_new = self.pk is None
        if is_new:
            # Создаем работы и ресурсы из шаблона
            super().save(*args, **kwargs)
            self._create_items_from_template()
        else:
            # Проверяем, изменился ли процент
            old_instance = EstimateSectionWorkType.objects.get(pk=self.pk)
            if old_instance.percentage != self.percentage:
                # Процент изменился - пересчитываем объемы
                super().save(*args, **kwargs)
                self._recalculate_items()
            else:
                super().save(*args, **kwargs)
    
    def _create_items_from_template(self):
        """Создание работ и ресурсов из шаблона типа работ"""
        # Площадь для этого типа работ
        type_area = self.section.total_area * (self.percentage / 100)
        
        # Получаем все работы из шаблона типа работ
        work_type_works = WorkTypeWork.objects.filter(work_type=self.work_type).order_by('order_index')
        
        for work_type_work in work_type_works:
            # Рассчитываем объем работы
            volume = type_area * work_type_work.work_volume_per_unit
            
            # Создаем или обновляем работу в ВОР
            estimate_item, created = EstimateItem.objects.get_or_create(
                section_work_type=self,
                work=work_type_work.work,
                defaults={'volume': volume}
            )
            
            if not created:
                # Обновляем объем существующей работы
                estimate_item.volume = volume
                estimate_item.save()
            
            # Получаем ресурсы для этой работы из шаблона
            work_resources = WorkResource.objects.filter(
                work_type=self.work_type,
                work=work_type_work.work
            )
            
            for work_resource in work_resources:
                # Рассчитываем количество ресурса
                quantity = volume * work_resource.quantity_per_unit
                
                # Создаем или обновляем ресурс в ВОР
                estimate_item_resource, created = EstimateItemResource.objects.get_or_create(
                    estimate_item=estimate_item,
                    resource=work_resource.resource,
                    defaults={'quantity': quantity}
                )
                
                if not created:
                    # Обновляем количество существующего ресурса
                    estimate_item_resource.quantity = quantity
                    estimate_item_resource.save()
    
    def _recalculate_items(self):
        """Пересчет объемов работ и количества ресурсов"""
        # Площадь для этого типа работ
        type_area = self.section.total_area * (self.percentage / 100)
        
        # Пересчитываем все работы
        for estimate_item in self.items.all():
            # Находим соответствующую работу в шаблоне
            try:
                work_type_work = WorkTypeWork.objects.get(
                    work_type=self.work_type,
                    work=estimate_item.work
                )
                # Рассчитываем новый объем
                new_volume = type_area * work_type_work.work_volume_per_unit
                estimate_item.volume = new_volume
                estimate_item.save()
                
                # Пересчитываем ресурсы для этой работы
                for estimate_item_resource in estimate_item.resources.all():
                    try:
                        work_resource = WorkResource.objects.get(
                            work_type=self.work_type,
                            work=estimate_item.work,
                            resource=estimate_item_resource.resource
                        )
                        # Рассчитываем новое количество
                        new_quantity = new_volume * work_resource.quantity_per_unit
                        estimate_item_resource.quantity = new_quantity
                        estimate_item_resource.save()
                    except WorkResource.DoesNotExist:
                        # Ресурс больше не в шаблоне - удаляем
                        estimate_item_resource.delete()
            except WorkTypeWork.DoesNotExist:
                # Работа больше не в шаблоне - удаляем
                estimate_item.delete()


class EstimateItem(models.Model):
    """
    ВОР_РАБОТЫ - Работы в конкретной ВОР с объемами
    🤖 Объем рассчитывается автоматически:
    volume = section_area × (percentage / 100) × work_volume_per_unit
    """
    section_work_type = models.ForeignKey(
        EstimateSectionWorkType,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name="Тип работ в разделе"
    )
    work = models.ForeignKey(
        Work,
        on_delete=models.PROTECT,
        related_name='estimate_items',
        verbose_name="Работа"
    )
    volume = models.FloatField(
        verbose_name="Объем работы",
        help_text="Рассчитывается автоматически на основе площади раздела, процента и объема работы на единицу типа работ"
    )

    class Meta:
        verbose_name = "Работа в ВОР (из шаблона)"
        verbose_name_plural = "Работы в ВОР (из шаблона)"
        ordering = ['section_work_type', 'work']
        unique_together = [['section_work_type', 'work']]

    def __str__(self):
        return f"{self.section_work_type.section.estimate.name} - {self.work.name} ({self.volume} {self.work.unit})"


class EstimateItemResource(models.Model):
    """
    ВОР_РАБОТА_РЕСУРСЫ - Ресурсы для работ в ВОР с количеством
    🤖 Количество рассчитывается автоматически: quantity = volume × quantity_per_unit
    """
    estimate_item = models.ForeignKey(
        EstimateItem,
        on_delete=models.CASCADE,
        related_name='resources',
        verbose_name="Работа в ВОР"
    )
    resource = models.ForeignKey(
        Resource,
        on_delete=models.PROTECT,
        related_name='estimate_item_resources',
        verbose_name="Ресурс"
    )
    quantity = models.FloatField(
        verbose_name="Количество ресурса",
        help_text="Рассчитывается автоматически на основе объема работы"
    )

    class Meta:
        verbose_name = "Ресурс работы в ВОР (из шаблона)"
        verbose_name_plural = "Ресурсы работ в ВОР (из шаблона)"
        ordering = ['estimate_item', 'resource']
        unique_together = [['estimate_item', 'resource']]

    def __str__(self):
        return f"{self.estimate_item.work.name} - {self.resource.name} ({self.quantity} {self.resource.unit})"
