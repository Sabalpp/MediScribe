from django.contrib import admin
from django.urls import path, include, re_path

from .views_spa import spa_index

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("interpreter.urls")),
    re_path(r"^.*$", spa_index),
]
