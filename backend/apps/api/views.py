from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from apps.reference.models import (
    WorkCategory, WorkType, Work, Resource,
    WorkTypeWork, WorkResource
)
from apps.estimates.models import (
    Estimate, EstimateSection, EstimateSectionWorkType,
    EstimateItem, EstimateItemResource
)
from .serializers import (
    WorkCategorySerializer, WorkTypeSerializer, WorkSerializer,
    ResourceSerializer, WorkTypeWorkSerializer, WorkResourceSerializer,
    EstimateSerializer, EstimateSectionSerializer,
    EstimateSectionWorkTypeSerializer, EstimateItemSerializer,
    EstimateItemResourceSerializer,
    EstimateDetailSerializer, EstimateSectionDetailSerializer,
    EstimateSectionWorkTypeDetailSerializer, EstimateItemDetailSerializer
)


# ========== Reference ViewSets ==========

class WorkCategoryViewSet(viewsets.ModelViewSet):
    queryset = WorkCategory.objects.all()
    serializer_class = WorkCategorySerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['name']
    ordering = ['name']


class WorkTypeViewSet(viewsets.ModelViewSet):
    queryset = WorkType.objects.select_related('category').all()
    serializer_class = WorkTypeSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category']
    search_fields = ['name', 'category__name']
    ordering_fields = ['category', 'name']
    ordering = ['category', 'name']


class WorkViewSet(viewsets.ModelViewSet):
    queryset = Work.objects.all()
    serializer_class = WorkSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'unit']
    ordering_fields = ['name']
    ordering = ['name']


class ResourceViewSet(viewsets.ModelViewSet):
    queryset = Resource.objects.all()
    serializer_class = ResourceSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'unit']
    ordering_fields = ['name']
    ordering = ['name']


class WorkTypeWorkViewSet(viewsets.ModelViewSet):
    queryset = WorkTypeWork.objects.select_related('work_type', 'work').all()
    serializer_class = WorkTypeWorkSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['work_type', 'work']
    search_fields = ['work_type__name', 'work__name']
    ordering_fields = ['work_type', 'order_index']
    ordering = ['work_type', 'order_index']


class WorkResourceViewSet(viewsets.ModelViewSet):
    queryset = WorkResource.objects.select_related('work_type', 'work', 'resource').all()
    serializer_class = WorkResourceSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['work_type', 'work', 'resource']
    search_fields = ['work_type__name', 'work__name', 'resource__name']
    ordering_fields = ['work_type', 'work', 'resource']
    ordering = ['work_type', 'work', 'resource']


# ========== Estimates ViewSets ==========

class EstimateViewSet(viewsets.ModelViewSet):
    queryset = Estimate.objects.prefetch_related('sections').all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['name', 'object_name']
    ordering_fields = ['created_at', 'name', 'status']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return EstimateDetailSerializer
        return EstimateSerializer


class EstimateSectionViewSet(viewsets.ModelViewSet):
    queryset = EstimateSection.objects.select_related('estimate', 'work_category').prefetch_related('work_types').all()
    serializer_class = EstimateSectionSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['estimate', 'work_category']
    search_fields = ['estimate__name', 'work_category__name']
    ordering_fields = ['estimate', 'work_category']
    ordering = ['estimate', 'work_category']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return EstimateSectionDetailSerializer
        return EstimateSectionSerializer


class EstimateSectionWorkTypeViewSet(viewsets.ModelViewSet):
    queryset = EstimateSectionWorkType.objects.select_related('section', 'work_type').prefetch_related('items').all()
    serializer_class = EstimateSectionWorkTypeSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['section', 'work_type']
    search_fields = ['section__estimate__name', 'work_type__name']
    ordering_fields = ['section', 'percentage']
    ordering = ['section', '-percentage']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return EstimateSectionWorkTypeDetailSerializer
        return EstimateSectionWorkTypeSerializer


class EstimateItemViewSet(viewsets.ModelViewSet):
    queryset = EstimateItem.objects.select_related('section_work_type', 'work').prefetch_related('resources').all()
    serializer_class = EstimateItemSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['section_work_type', 'work']
    search_fields = ['work__name', 'section_work_type__work_type__name']
    ordering_fields = ['section_work_type', 'work']
    ordering = ['section_work_type', 'work']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return EstimateItemDetailSerializer
        return EstimateItemSerializer


class EstimateItemResourceViewSet(viewsets.ModelViewSet):
    queryset = EstimateItemResource.objects.select_related('estimate_item', 'resource').all()
    serializer_class = EstimateItemResourceSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['estimate_item', 'resource']
    search_fields = ['resource__name', 'estimate_item__work__name']
    ordering_fields = ['estimate_item', 'resource']
    ordering = ['estimate_item', 'resource']