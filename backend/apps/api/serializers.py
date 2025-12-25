from rest_framework import serializers
from apps.reference.models import (
    WorkCategory, WorkType, Work, Resource,
    WorkTypeWork, WorkResource
)
from apps.estimates.models import (
    Estimate, EstimateSection, EstimateSectionWorkType,
    EstimateItem, EstimateItemResource
)


# ========== Reference Serializers ==========

class WorkCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkCategory
        fields = ['id', 'name']
        read_only_fields = ['id']


class WorkTypeSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = WorkType
        fields = ['id', 'category', 'category_name', 'name']
        read_only_fields = ['id']


class WorkSerializer(serializers.ModelSerializer):
    class Meta:
        model = Work
        fields = ['id', 'name', 'unit']
        read_only_fields = ['id']


class ResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resource
        fields = ['id', 'name', 'unit']
        read_only_fields = ['id']


class WorkTypeWorkSerializer(serializers.ModelSerializer):
    work_type_name = serializers.CharField(source='work_type.name', read_only=True)
    work_name = serializers.CharField(source='work.name', read_only=True)
    work_unit = serializers.CharField(source='work.unit', read_only=True)
    
    class Meta:
        model = WorkTypeWork
        fields = [
            'id', 'work_type', 'work_type_name', 'work', 'work_name',
            'work_unit', 'order_index', 'work_volume_per_unit'
        ]
        read_only_fields = ['id']


class WorkResourceSerializer(serializers.ModelSerializer):
    work_type_name = serializers.CharField(source='work_type.name', read_only=True)
    work_name = serializers.CharField(source='work.name', read_only=True)
    resource_name = serializers.CharField(source='resource.name', read_only=True)
    resource_unit = serializers.CharField(source='resource.unit', read_only=True)
    
    class Meta:
        model = WorkResource
        fields = [
            'id', 'work_type', 'work_type_name', 'work', 'work_name',
            'resource', 'resource_name', 'resource_unit', 'quantity_per_unit'
        ]
        read_only_fields = ['id']


# ========== Estimates Serializers ==========

class EstimateSerializer(serializers.ModelSerializer):
    sections_count = serializers.IntegerField(source='sections.count', read_only=True)
    
    class Meta:
        model = Estimate
        fields = [
            'id', 'name', 'object_name', 'created_at', 'status', 'sections_count'
        ]
        read_only_fields = ['id', 'created_at']


class EstimateSectionSerializer(serializers.ModelSerializer):
    estimate_name = serializers.CharField(source='estimate.name', read_only=True)
    work_category_name = serializers.CharField(source='work_category.name', read_only=True)
    work_types_count = serializers.IntegerField(source='work_types.count', read_only=True)
    
    class Meta:
        model = EstimateSection
        fields = [
            'id', 'estimate', 'estimate_name', 'work_category', 'work_category_name',
            'total_area', 'work_types_count'
        ]
        read_only_fields = ['id']


class EstimateSectionWorkTypeSerializer(serializers.ModelSerializer):
    section_info = serializers.CharField(source='section.__str__', read_only=True)
    work_type_name = serializers.CharField(source='work_type.name', read_only=True)
    items_count = serializers.IntegerField(source='items.count', read_only=True)
    
    class Meta:
        model = EstimateSectionWorkType
        fields = [
            'id', 'section', 'section_info', 'work_type', 'work_type_name',
            'percentage', 'items_count'
        ]
        read_only_fields = ['id']


class EstimateItemSerializer(serializers.ModelSerializer):
    section_work_type_info = serializers.CharField(source='section_work_type.__str__', read_only=True)
    work_name = serializers.CharField(source='work.name', read_only=True)
    work_unit = serializers.CharField(source='work.unit', read_only=True)
    resources_count = serializers.IntegerField(source='resources.count', read_only=True)
    
    class Meta:
        model = EstimateItem
        fields = [
            'id', 'section_work_type', 'section_work_type_info', 'work', 'work_name',
            'work_unit', 'volume', 'resources_count'
        ]
        read_only_fields = ['id']


class EstimateItemResourceSerializer(serializers.ModelSerializer):
    estimate_item_info = serializers.CharField(source='estimate_item.__str__', read_only=True)
    resource_name = serializers.CharField(source='resource.name', read_only=True)
    resource_unit = serializers.CharField(source='resource.unit', read_only=True)
    
    class Meta:
        model = EstimateItemResource
        fields = [
            'id', 'estimate_item', 'estimate_item_info', 'resource', 'resource_name',
            'resource_unit', 'quantity'
        ]
        read_only_fields = ['id']


# ========== Nested Serializers для детального просмотра ==========

# 1. Самый вложенный уровень: работа с ресурсами
class EstimateItemDetailSerializer(EstimateItemSerializer):
    resources = EstimateItemResourceSerializer(many=True, read_only=True)
    
    class Meta(EstimateItemSerializer.Meta):
        fields = EstimateItemSerializer.Meta.fields + ['resources']


# 2. Тип работ с работами (использует EstimateItemDetailSerializer)
class EstimateSectionWorkTypeDetailSerializer(EstimateSectionWorkTypeSerializer):
    items = EstimateItemDetailSerializer(many=True, read_only=True)  # ← ИСПРАВЛЕНО: было EstimateItemSerializer
    
    class Meta(EstimateSectionWorkTypeSerializer.Meta):
        fields = EstimateSectionWorkTypeSerializer.Meta.fields + ['items']


# 3. Раздел с типами работ
class EstimateSectionDetailSerializer(EstimateSectionSerializer):
    work_types = EstimateSectionWorkTypeDetailSerializer(many=True, read_only=True)
    
    class Meta(EstimateSectionSerializer.Meta):
        fields = EstimateSectionSerializer.Meta.fields + ['work_types']


# 4. ВОР с разделами
class EstimateDetailSerializer(EstimateSerializer):
    sections = EstimateSectionDetailSerializer(many=True, read_only=True)
    
    class Meta(EstimateSerializer.Meta):
        fields = EstimateSerializer.Meta.fields + ['sections']