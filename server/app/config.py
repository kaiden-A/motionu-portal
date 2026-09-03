from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

_ENV_FILE = Path(__file__).resolve().parents[1] / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=_ENV_FILE, extra="ignore")

    database_url: str
    zitadel_issuer: str
    zitadel_jwks_uri: str
    zitadel_audience: str
    zitadel_allowed_org_id: str
    zitadel_required_roles: list[str] = ["member", "membership"]
    bot_token: str
    zitadel_actions_signing_key: str = ""
    cors_origins: str = "http://localhost:3000"


settings = Settings()
