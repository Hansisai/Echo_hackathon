import os

class Settings:
    FEATHERLESS_API_KEY: str = os.getenv("FEATHERLESS_API_KEY", "rc_f5dc95ae541d2dfe3885c372e2dc6722412c8f3b109c60360bd00983af124472")
    FEATHERLESS_MODEL: str = os.getenv("FEATHERLESS_MODEL", "meta-llama/Meta-Llama-3.1-8B-Instruct")
    DATABASE_URL: str = "sqlite:///./database.db"

settings = Settings()
