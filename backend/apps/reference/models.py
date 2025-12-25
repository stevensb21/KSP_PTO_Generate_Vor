from django.db import models
from django.core.exceptions import ValidationError


class WorkCategory(models.Model):
    """
    ВИДЫ_РАБОТ - Самый верхний уровень классификации работ
    Примеры: Полы, Кровля, Стены
    """
    name = models.CharField(max_length=255, verbose_name="Название вида работ")

    class Meta:
        verbose_name = "Вид работ"
        verbose_name_plural = "Виды работ"
        ordering = ['name']

    def __str__(self):
        return self.name


class WorkType(models.Model):
    """
    ТИПЫ_РАБОТ - Конкретные варианты для каждого вида работ
    Примеры: Линолеум спортивный, Линолеум коммерческий, Плитка керамогранит
    """
    category = models.ForeignKey(
        WorkCategory,
        on_delete=models.CASCADE,
        related_name='work_types',
        verbose_name="Вид работ"
    )
    name = models.CharField(max_length=255, verbose_name="Название типа работ")

    class Meta:
        verbose_name = "Тип работ"
        verbose_name_plural = "Типы работ"
        ordering = ['category', 'name']

    def __str__(self):
        return f"{self.category.name} - {self.name}"


class Work(models.Model):
    """
    РАБОТЫ - Конкретные операции, которые выполняются
    Примеры: Устройство песчаного слоя, Устройство ПЭ пленки, Устройство стяжки
    """
    name = models.CharField(max_length=255, verbose_name="Наименование работы")
    unit = models.CharField(max_length=50, verbose_name="Единица измерения")

    class Meta:
        verbose_name = "Работа"
        verbose_name_plural = "Работы"
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.unit})"


class Resource(models.Model):
    """
    РЕСУРСЫ - Материалы и компоненты, используемые в работах
    Примеры: Песок, Сухая смесь, Фиброволокно, ПЭ пленка
    """
    name = models.CharField(max_length=255, verbose_name="Наименование ресурса")
    unit = models.CharField(max_length=50, verbose_name="Единица измерения")

    class Meta:
        verbose_name = "Ресурс"
        verbose_name_plural = "Ресурсы"
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.unit})"


class WorkTypeWork(models.Model):
    """
    ТИП_РАБОТ_РАБОТЫ - Связь типа работ с конкретными работами
    Определяет, какие работы входят в каждый тип работ и в каком порядке
    ⚠️ Объем работы на единицу типа работ зависит от типа работ
    """
    work_type = models.ForeignKey(
        WorkType,
        on_delete=models.CASCADE,
        related_name='work_type_works',
        verbose_name="Тип работ"
    )
    work = models.ForeignKey(
        Work,
        on_delete=models.CASCADE,
        related_name='work_type_works',
        verbose_name="Работа"
    )
    order_index = models.IntegerField(default=0, verbose_name="Порядок следования")
    work_volume_per_unit = models.FloatField(
        default=1.0,
        verbose_name="Объем работы на единицу типа работ",
        help_text="Объем работы (в единицах измерения работы) на единицу типа работ. Например, м³ стяжки на 1 м² типа работ"
    )

    class Meta:
        verbose_name = "Работа в типе работ"
        verbose_name_plural = "Работы в типах работ"
        ordering = ['work_type', 'order_index']
        unique_together = [['work_type', 'work']]

    def clean(self):
        """Валидация данных"""
        if self.work_volume_per_unit < 0:
            raise ValidationError({
                'work_volume_per_unit': 'Объем работы не может быть отрицательным'
            })

    def save(self, *args, **kwargs):
        """Вызов clean при сохранении"""
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.work_type.name} - {self.work.name} ({self.work_volume_per_unit} {self.work.unit})"


class WorkResource(models.Model):
    """
    РАБОТА_РЕСУРСЫ - Связь работы с ресурсами
    Определяет, какие ресурсы и в каком количестве нужны для выполнения работы
    ⚠️ Количество зависит от типа работ, поэтому связь включает work_type
    """
    work_type = models.ForeignKey(
        WorkType,
        on_delete=models.CASCADE,
        related_name='work_resources',
        verbose_name="Тип работ"
    )
    work = models.ForeignKey(
        Work,
        on_delete=models.CASCADE,
        related_name='work_resources',
        verbose_name="Работа"
    )
    resource = models.ForeignKey(
        Resource,
        on_delete=models.CASCADE,
        related_name='work_resources',
        verbose_name="Ресурс"
    )
    quantity_per_unit = models.FloatField(
        verbose_name="Количество на единицу работы",
        help_text="Сколько ресурса требуется на одну единицу работы (зависит от типа работ)"
    )

    class Meta:
        verbose_name = "Ресурс работы"
        verbose_name_plural = "Ресурсы работ"
        ordering = ['work_type', 'work', 'resource']
        unique_together = [['work_type', 'work', 'resource']]

    def clean(self):
        """Валидация данных"""
        if self.quantity_per_unit < 0:
            raise ValidationError({
                'quantity_per_unit': 'Количество ресурса не может быть отрицательным'
            })

    def save(self, *args, **kwargs):
        """Вызов clean при сохранении"""
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.work_type.name} - {self.work.name} - {self.resource.name} ({self.quantity_per_unit})"
