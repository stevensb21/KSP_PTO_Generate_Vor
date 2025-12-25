from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _


class ReferenceConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.reference'
    verbose_name = _('📚 Справочники')
