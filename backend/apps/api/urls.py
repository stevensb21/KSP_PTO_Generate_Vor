from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    WorkCategoryViewSet, WorkTypeViewSet, WorkViewSet, ResourceViewSet,
    WorkTypeWorkViewSet, WorkResourceViewSet,
    EstimateViewSet, EstimateSectionViewSet, EstimateSectionWorkTypeViewSet,
    EstimateItemViewSet, EstimateItemResourceViewSet,
    CustomAuthToken, LogoutView
)

router = DefaultRouter()
router.register(r'work-categories', WorkCategoryViewSet, basename='work-category')
router.register(r'work-types', WorkTypeViewSet, basename='work-type')
router.register(r'works', WorkViewSet, basename='work')
router.register(r'resources', ResourceViewSet, basename='resource')
router.register(r'work-type-works', WorkTypeWorkViewSet, basename='work-type-work')
router.register(r'work-resources', WorkResourceViewSet, basename='work-resource')
router.register(r'estimates', EstimateViewSet, basename='estimate')
router.register(r'estimate-sections', EstimateSectionViewSet, basename='estimate-section')
router.register(r'estimate-section-work-types', EstimateSectionWorkTypeViewSet, basename='estimate-section-work-type')
router.register(r'estimate-items', EstimateItemViewSet, basename='estimate-item')
router.register(r'estimate-item-resources', EstimateItemResourceViewSet, basename='estimate-item-resource')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/login/', CustomAuthToken.as_view(), name='api_token_auth'),
    path('auth/logout/', LogoutView.as_view(), name='api_logout'),
]