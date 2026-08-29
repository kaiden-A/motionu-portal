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

# Resolve the forward reference `CardPublic` in MemberMe (defined in cards.py).
MemberMe.model_rebuild()

__all__ = [
    "AppCreate",
    "AppPublic",
    "AppUpdate",
    "CardAdmin",
    "CardAssignRequest",
    "CardCreate",
    "CardPublic",
    "DepartmentPublic",
    "DirectoryUser",
    "MemberDirectoryItem",
    "MemberMe",
    "MemberPublic",
]
