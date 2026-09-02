from fastapi import FastAPI
from pydantic import BaseModel
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


app = FastAPI(
    title="SkillBridge AI Service",
    version="2.0.0",
)


KNOWLEDGE_BASE = [
    {
        "topic": "REST API Development",
        "keywords": [
            "rest",
            "rest api",
            "api",
            "http",
            "endpoint",
            "authentication",
            "pagination",
        ],
        "content": (
            "REST APIs use HTTP resources, clear endpoints, authentication, "
            "validation, pagination, error handling and rate limiting."
        ),
        "steps": [
            "Learn HTTP methods, status codes and REST principles.",
            "Build CRUD endpoints with validation and error handling.",
            "Add authentication and authorization.",
            "Implement pagination, filtering and rate limiting.",
            "Build and deploy a complete REST API project.",
        ],
    },
    {
        "topic": "Database Migrations",
        "keywords": [
            "database",
            "migration",
            "migrations",
            "schema",
            "postgresql",
            "sql",
        ],
        "content": (
            "Database migrations should be versioned, reversible where practical, "
            "tested and safe for production deployment."
        ),
        "steps": [
            "Understand relational database schemas and constraints.",
            "Learn how migration files represent schema changes.",
            "Practice creating and reverting migrations.",
            "Test migrations against realistic development data.",
            "Learn safe production migration strategies.",
        ],
    },
    {
        "topic": "System Design",
        "keywords": [
            "system design",
            "architecture",
            "scalability",
            "availability",
            "caching",
            "queue",
            "queues",
            "load balancing",
        ],
        "content": (
            "System design involves scalability, availability, consistency, "
            "caching, queues, observability and trade-off analysis."
        ),
        "steps": [
            "Learn functional and non-functional requirements.",
            "Understand APIs, databases and caching.",
            "Study load balancing and horizontal scaling.",
            "Learn queues and asynchronous processing.",
            "Practice designing systems and explaining trade-offs.",
        ],
    },
    {
        "topic": "Docker and Containerization",
        "keywords": [
            "docker",
            "container",
            "containers",
            "containerization",
            "dockerfile",
            "compose",
            "ci/cd",
        ],
        "content": (
            "Docker packages an application and its dependencies into "
            "reproducible containers. Docker Compose can coordinate "
            "multi-service applications."
        ),
        "steps": [
            "Understand images, containers and Dockerfiles.",
            "Containerize a backend application.",
            "Learn Docker networking and volumes.",
            "Use Docker Compose for multi-service applications.",
            "Connect containers to CI/CD workflows.",
        ],
    },
    {
        "topic": "Cloud Readiness",
        "keywords": [
            "cloud",
            "aws",
            "azure",
            "gcp",
            "deployment",
            "networking",
            "iam",
            "monitoring",
        ],
        "content": (
            "Cloud readiness includes deployment, networking, storage, "
            "identity and access management, monitoring and cost awareness."
        ),
        "steps": [
            "Learn basic cloud compute and networking concepts.",
            "Understand managed databases and object storage.",
            "Learn IAM and secure application configuration.",
            "Deploy an application to a cloud environment.",
            "Add monitoring, logging and cost controls.",
        ],
    },
    {
        "topic": "Backend Development",
        "keywords": [
            "backend",
            "server",
            "express",
            "node",
            "node.js",
            "fastapi",
            "microservices",
        ],
        "content": (
            "Backend development combines APIs, business logic, databases, "
            "authentication, validation, security, testing and deployment."
        ),
        "steps": [
            "Learn a backend programming language and framework.",
            "Build REST APIs and connect them to a database.",
            "Implement authentication and authorization.",
            "Add validation, logging, testing and error handling.",
            "Deploy a production-style backend project.",
        ],
    },
]


class Chat(BaseModel):
    message: str


def build_documents():
    return [
        f"{item['topic']} {item['content']} {' '.join(item['keywords'])}"
        for item in KNOWLEDGE_BASE
    ]


def find_best_topic(message: str):
    documents = build_documents()

    vectorizer = TfidfVectorizer(
        lowercase=True,
        stop_words="english",
    )

    matrix = vectorizer.fit_transform(documents + [message])

    scores = cosine_similarity(
        matrix[-1],
        matrix[:-1],
    ).flatten()

    index = int(scores.argmax())

    return KNOWLEDGE_BASE[index], float(scores[index])


def build_answer(topic, confidence):
    confidence_percent = round(confidence * 100)

    answer = (
        f"### {topic['topic']}\n\n"
        f"{topic['content']}\n\n"
        f"**Recommended learning path:**\n"
    )

    for number, step in enumerate(topic["steps"], start=1):
        answer += f"{number}. {step}\n"

    answer += f"\n**AI confidence:** {confidence_percent}%"

    return answer


@app.get("/health")
def health():
    return {
        "ok": True,
        "service": "skillbridge-ai",
        "version": "2.0.0",
    }


@app.post("/mentor")
def mentor(body: Chat):
    message = body.message.strip()

    if not message:
        return {
            "answer": "Please enter a question so I can help you.",
            "confidence": 0.0,
            "topic": None,
        }

    topic, confidence = find_best_topic(message)

    if confidence < 0.08:
        return {
            "answer": (
                "I could not confidently identify the topic of your question. "
                "Try asking about REST APIs, databases, system design, Docker, "
                "cloud, or backend development."
            ),
            "confidence": round(confidence, 4),
            "topic": None,
        }

    return {
        "answer": build_answer(topic, confidence),
        "confidence": round(confidence, 4),
        "topic": topic["topic"],
        "steps": topic["steps"],
    }