import pam
from dotenv import load_dotenv
import os

load_dotenv()

apiKey = os.getenv("API_KEY")


def check_system_auth(username, password):

    p = pam.pam()
    
    # This sends the credentials to the system's PAM stack
    if p.authenticate(username, password):
        return apiKey
    else:
        return None
