from fastapi import FastAPI
from pydantic import BaseModel
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
app=FastAPI(title='SkillBridge AI Service',version='1.0.0')
KB=['REST APIs use HTTP resources, authentication, validation, pagination and rate limiting.','Database migrations should be versioned, reversible where practical, tested, and safe for production deployment.','System design requires scalability, availability, consistency, caching, queues, observability and trade-off analysis.','Docker packages an application and its dependencies into reproducible containers; CI/CD can build, test and deploy them.','Cloud readiness includes deployment, networking, storage, IAM, monitoring and cost awareness.']
class Chat(BaseModel): message:str
@app.get('/health')
def health(): return {'ok':True,'service':'skillbridge-ai'}
@app.post('/mentor')
def mentor(body:Chat):
    v=TfidfVectorizer().fit(KB+[body.message]); m=v.transform(KB+[body.message]); scores=cosine_similarity(m[-1],m[:-1]).flatten(); idx=scores.argmax(); return {'answer':KB[idx],'confidence':float(scores[idx])}
