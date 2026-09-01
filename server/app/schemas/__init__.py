from app.schemas.achievements import (
    AchievementAssign,
    AchievementCreate,
    AchievementPublic,
    AchievementUpdate,
)
from app.schemas.apps import AppCreate, AppPublic, AppUpdate
from app.schemas.cards import (
    CardAdmin,
    CardAssignRequest,
    CardCreate,
    CardPublic,
    DirectoryUser,
)
from app.schemas.members import (
    DepartmentPublic,
    MemberDirectoryItem,
    MemberMe,
    MemberPublic,
)
from app.schemas.news import (
    EventCreate,
    EventPublic,
    EventUpdate,
    NewsCreate,
    NewsPublic,
    NewsUpdate,
)
from app.schemas.users import (
    ALLOWED_ROLE_KEYS,
    PortalUser,
    PortalUserCreate,
    PortalUserUpdate,
)

# Resolve the forward reference `CardPublic` in MemberMe (defined in cards.py).
MemberMe.model_rebuild()

__all__ = [
    "ALLOWED_ROLE_KEYS",
    "AchievementAssign",
    "AchievementCreate",
    "AchievementPublic",
    "AchievementUpdate",
    "AppCreate",
    "AppPublic",
    "AppUpdate",
    "CardAdmin",
    "CardAssignRequest",
    "CardCreate",
    "CardPublic",
    "DepartmentPublic",
    "DirectoryUser",
    "EventCreate",
    "EventPublic",
    "EventUpdate",
    "MemberDirectoryItem",
    "MemberMe",
    "MemberPublic",
    "NewsCreate",
    "NewsPublic",
    "NewsUpdate",
    "PortalUser",
    "PortalUserCreate",
    "PortalUserUpdate",
]
