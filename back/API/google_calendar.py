# from google.oauth2 import service_account
# from googleapiclient.discovery import build


# def add_to_calendar(event_id, date, location):
#     SCOPES = ['https://www.googleapis.com/auth/calendar']

#     creds = service_account.Credentials.from_service_account_file(
#         'service-account.json',
#         scopes=SCOPES
#     )
#     service = build("calendar", "v3", credentials=creds)
#     event = {
#         "summary": event_id,
#         "description": location,
#         "start": {
#             "dateTime": f"{date}T10:00:00+03:00",
#             "timeZone": "Europe/Moscow"
#         },
#         "end": {
#             "dateTime": f"{date}T11:00:00+03:00",
#             "timeZone": "Europe/Moscow"
#         }
#     }

#     # Добавляем в календарь
#     created_event = service.events().insert(
#         calendarId="primary",
#         body=event
#     ).execute()

#     return created_event
