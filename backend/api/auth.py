import pam

def check_system_auth(username, password):

    p = pam.pam()
    
    # This sends the credentials to the system's PAM stack
    if p.authenticate(username, password):
        return True
    else:
        return False
