from django.urls import path
from .views import ChatHistoryView, SendChatMessageView

urlpatterns = [
    path("history/", ChatHistoryView.as_view(), name="chat-history"),
    path("send/", SendChatMessageView.as_view(), name="chat-send"),
]