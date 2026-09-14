#!/usr/bin/env python3
import os
import urllib.request
import json

API_KEY = os.environ.get("NEXT_PUBLIC_FIREBASE_API_KEY", os.environ.get("FIREBASE_API_KEY", ""))
PROJECT_ID = "nspc-web"
DB_ID = "(default)"
URL = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/{DB_ID}/documents/kmfw_content/careers?key={API_KEY}"

payload = {
    "fields": {
        "title": {"stringValue": "Careers"},
        "lastUpdated": {"stringValue": "2026-04-21T04:29:00.000Z"},
        "sections": {
            "mapValue": {
                "fields": {
                    "hero": {
                        "mapValue": {
                            "fields": {
                                "heading": {"stringValue": "Current Job Postings"},
                                "content": {"stringValue": "Join our dedicated team of professionals committed to equity, empowerment, and excellence in community wellness."},
                                "enabled": {"booleanValue": True},
                                "order": {"integerValue": 0}
                            }
                        }
                    },
                    "job_1": {
                        "mapValue": {
                            "fields": {
                                "heading": {"stringValue": "Addiction Counsellor (RAAM)"},
                                "location": {"stringValue": "Kitchener, ON, Canada"},
                                "jobType": {"stringValue": "Full Time"},
                                "pdfUrl": {"stringValue": "#"},
                                "enabled": {"booleanValue": True},
                                "order": {"integerValue": 20}
                            }
                        }
                    },
                    "job_2": {
                        "mapValue": {
                            "fields": {
                                "heading": {"stringValue": "Addiction Counsellor (CC)"},
                                "location": {"stringValue": "Kitchener, ON, Canada"},
                                "jobType": {"stringValue": "Contract"},
                                "pdfUrl": {"stringValue": "#"},
                                "enabled": {"booleanValue": True},
                                "order": {"integerValue": 30}
                            }
                        }
                    },
                    "job_3": {
                        "mapValue": {
                            "fields": {
                                "heading": {"stringValue": "Overnight Attendant (CLT)"},
                                "location": {"stringValue": "Cambridge, ON, Canada"},
                                "jobType": {"stringValue": "Part Time"},
                                "pdfUrl": {"stringValue": "#"},
                                "enabled": {"booleanValue": True},
                                "order": {"integerValue": 40}
                            }
                        }
                    },
                    "job_4": {
                        "mapValue": {
                            "fields": {
                                "heading": {"stringValue": "Landscape Labourer - Canada Summer Jobs"},
                                "location": {"stringValue": "Kitchener, ON, Canada"},
                                "jobType": {"stringValue": "Contract"},
                                "externalLink": {"stringValue": "https://www.jobbank.gc.ca/"},
                                "enabled": {"booleanValue": True},
                                "order": {"integerValue": 50}
                            }
                        }
                    },
                    "job_5": {
                        "mapValue": {
                            "fields": {
                                "heading": {"stringValue": "Supervisor, Addiction Services (CLT)"},
                                "location": {"stringValue": "Cambridge, ON, Canada"},
                                "jobType": {"stringValue": "Contract"},
                                "pdfUrl": {"stringValue": "#"},
                                "enabled": {"booleanValue": True},
                                "order": {"integerValue": 60}
                            }
                        }
                    },
                    "job_6": {
                        "mapValue": {
                            "fields": {
                                "heading": {"stringValue": "Donor Relations & Grants Coordinator"},
                                "location": {"stringValue": "Kitchener, ON, Canada"},
                                "jobType": {"stringValue": "Full Time"},
                                "externalLink": {"stringValue": "https://linktr.ee/kmfw"},
                                "enabled": {"booleanValue": True},
                                "order": {"integerValue": 70}
                            }
                        }
                    },
                    "job_7": {
                        "mapValue": {
                            "fields": {
                                "heading": {"stringValue": "ShelterCare Support Worker, Nights Relief"},
                                "location": {"stringValue": "Waterloo, ON, Canada"},
                                "jobType": {"stringValue": "Part Time"},
                                "pdfUrl": {"stringValue": "#"},
                                "enabled": {"booleanValue": True},
                                "order": {"integerValue": 80}
                            }
                        }
                    },
                    "job_8": {
                        "mapValue": {
                            "fields": {
                                "heading": {"stringValue": "Manager, Addiction Services (ACSS)"},
                                "location": {"stringValue": "Kitchener, ON, Canada"},
                                "jobType": {"stringValue": "Full Time"},
                                "pdfUrl": {"stringValue": "#"},
                                "enabled": {"booleanValue": True},
                                "order": {"integerValue": 90}
                            }
                        }
                    },
                    "job_9": {
                        "mapValue": {
                            "fields": {
                                "heading": {"stringValue": "General Applications"},
                                "location": {"stringValue": "Waterloo Region, ON, Canada"},
                                "jobType": {"stringValue": "Other"},
                                "buttonUrl": {"stringValue": "mailto:careers@kindmindsfamilywellness.org"},
                                "buttonText": {"stringValue": "Inquire via Email"},
                                "enabled": {"booleanValue": True},
                                "order": {"integerValue": 100}
                            }
                        }
                    }
                }
            }
        }
    }
}

data = json.dumps(payload).encode("utf-8")
req = urllib.request.Request(URL, data=data, method="PATCH")
req.add_header("Content-Type", "application/json")

try:
    with urllib.request.urlopen(req) as resp:
        result = json.load(resp)
        if "name" in result:
            print("SUCCESS: Firestore document written!")
            print("Document:", result["name"])
        else:
            print("Unexpected response:", result)
except urllib.error.HTTPError as e:
    body = e.read().decode()
    print(f"HTTP {e.code} Error:", body)
except Exception as e:
    print("Error:", str(e))
