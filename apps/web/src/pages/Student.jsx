import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { Card, Header, Bar, Stat } from '../components/UI';
import Roadmap from '../components/roadmap/Roadmap';

export default function Student({ section = 'dashboard' }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [skill, setSkill] = useState('');
  const [have, setHave] = useState(50);
  const [need, setNeed] = useState(80);
  const [savingSkill, setSavingSkill] = useState(false);

  const [resume, setResume] = useState('');
  const [ats, setAts] = useState(null);
  const [analyzingResume, setAnalyzingResume] = useState(false);

  const [chat, setChat] = useState('');
  const [reply, setReply] = useState('');
  const [askingMentor, setAskingMentor] = useState(false);

  /*
   * -----------------------------------------
   * LOAD STUDENT
   * -----------------------------------------
   */

  const loadStudent = async () => {
    try {
      setError('');

      const student = await api('/students/me');

      setData(student);
    } catch (requestError) {
      console.error('Unable to load student:', requestError);

      setError(
        requestError?.message ||
          'Unable to load your student profile.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudent();
  }, []);

  /*
   * -----------------------------------------
   * DERIVED STUDENT METRICS
   * -----------------------------------------
   */

  const skills = data?.skills || [];
  const assessments = data?.assessments || [];

  const confidenceScore = useMemo(() => {
    if (skills.length === 0) return 0;

    const total = skills.reduce(
      (sum, currentSkill) =>
        sum + Number(currentSkill.have || 0),
      0
    );

    return Math.round(total / skills.length);
  }, [skills]);

  const verifiedSkills = useMemo(() => {
    return skills.filter(
      (currentSkill) =>
        Number(currentSkill.have || 0) >=
        Number(currentSkill.need || 0)
    ).length;
  }, [skills]);

  /*
   * -----------------------------------------
   * ADD SKILL
   * -----------------------------------------
   */

  const add = async () => {
    if (!skill.trim() || savingSkill) return;

    const currentLevel = Number(have);
    const targetLevel = Number(need);

    if (
      !Number.isInteger(currentLevel) ||
      currentLevel < 0 ||
      currentLevel > 100
    ) {
      setError(
        'Current skill level must be an integer between 0 and 100.'
      );
      return;
    }

    if (
      !Number.isInteger(targetLevel) ||
      targetLevel < 0 ||
      targetLevel > 100
    ) {
      setError(
        'Target skill level must be an integer between 0 and 100.'
      );
      return;
    }

    const newSkill = {
      name: skill.trim(),
      have: currentLevel,
      need: targetLevel
    };

    try {
      setSavingSkill(true);
      setError('');

      await api('/students/me/skills', {
        method: 'POST',
        body: JSON.stringify(newSkill)
      });

      await loadStudent();

      setSkill('');
      setHave(50);
      setNeed(80);
    } catch (requestError) {
      console.error('Unable to save skill:', requestError);

      setError(
        requestError?.message ||
          'Unable to save this skill.'
      );
    } finally {
      setSavingSkill(false);
    }
  };

  /*
   * -----------------------------------------
   * RESUME / ATS
   * -----------------------------------------
   */

  const analyze = async () => {
    if (!resume.trim() || analyzingResume) return;

    try {
      setAnalyzingResume(true);

      const result = await api('/ai/ats', {
        method: 'POST',
        body: JSON.stringify({
          resume,
          targetRole:
            data?.targetRole || 'Backend Developer'
        })
      });

      setAts(result);
    } catch (requestError) {
      console.error(
        'Unable to analyze resume:',
        requestError
      );

      setAts(null);

      setError(
        requestError?.message ||
          'Unable to analyze the resume.'
      );
    } finally {
      setAnalyzingResume(false);
    }
  };

  /*
   * -----------------------------------------
   * AI CAREER MENTOR
   * -----------------------------------------
   */

  const ask = async () => {
    if (!chat.trim() || askingMentor) return;

    try {
      setAskingMentor(true);

      const result = await api('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: chat,
          context: {
            targetRole:
              data?.targetRole ||
              'Backend Developer',

            skills,

            assessments
          }
        })
      });

      setReply(
        result?.answer ||
          'I could not generate a response right now.'
      );
    } catch (requestError) {
      console.error(
        'Unable to contact AI mentor:',
        requestError
      );

      setReply(
        'I could not reach the AI mentor right now. Please try again.'
      );
    } finally {
      setAskingMentor(false);
    }
  };

  /*
   * -----------------------------------------
   * LOADING
   * -----------------------------------------
   */

  if (loading) {
    return (
      <div className="p-6 lg:p-10 max-w-6xl">
        <Header
          eyebrow="Student"
          title="Loading your career profile..."
        />

        <Card>
          <p className="muted text-sm">
            Connecting to your SkillBridge profile.
          </p>
        </Card>
      </div>
    );
  }

  /*
   * -----------------------------------------
   * ERROR
   * -----------------------------------------
   */

  if (!data) {
    return (
      <div className="p-6 lg:p-10 max-w-6xl">
        <Header
          eyebrow="Student"
          title="Unable to load your profile"
        />

        <Card>
          <p className="text-sm">
            {error ||
              'Something went wrong while loading your student profile.'}
          </p>

          <button
            className="btn btn-primary mt-4"
            onClick={loadStudent}
          >
            Try again
          </button>
        </Card>
      </div>
    );
  }

  /*
   * -----------------------------------------
   * RESUME / ATS
   * -----------------------------------------
   */

  if (section === 'resume') {
    return (
      <div className="p-6 lg:p-10 max-w-6xl">
        <Header
          eyebrow="Student · Profile"
          title="Resume & ATS score"
        />

        {error && (
          <Card className="mb-5">
            <p className="text-sm">
              {error}
            </p>
          </Card>
        )}

        <div className="grid lg:grid-cols-2 gap-5">
          <Card>
            <h3 className="font-semibold mb-3">
              Paste resume text
            </h3>

            <textarea
              value={resume}
              onChange={(e) =>
                setResume(e.target.value)
              }
              className="w-full min-h-64 border rounded-lg p-3 text-sm"
              placeholder="Paste your resume here..."
            />

            <button
              className="btn btn-primary mt-3"
              onClick={analyze}
              disabled={analyzingResume}
            >
              {analyzingResume
                ? 'Analyzing...'
                : 'Analyze resume'}
            </button>
          </Card>

          <Card>
            <h3 className="font-semibold mb-3">
              ATS compatibility
            </h3>

            <div className="text-5xl mono font-semibold text-teal">
              {ats ? ats.overall : '--'}

              <span className="text-lg muted">
                /100
              </span>
            </div>

            {ats && (
              <div className="mt-5 space-y-3">
                {ats.categories?.map(
                  (category) => (
                    <div key={category.name}>
                      <div className="flex justify-between text-xs mb-1">
                        <span>
                          {category.name}
                        </span>

                        <span>
                          {category.score}
                        </span>
                      </div>

                      <Bar
                        value={category.score}
                      />
                    </div>
                  )
                )}
              </div>
            )}
          </Card>
        </div>

        {ats && (
          <Card className="mt-5">
            <h3 className="font-semibold mb-3">
              Feedback
            </h3>

            <div className="space-y-2 text-sm">
              {ats.issues?.map(
                (issue, index) => (
                  <p key={index}>
                    • {issue}
                  </p>
                )
              )}
            </div>
          </Card>
        )}
      </div>
    );
  }

  /*
   * -----------------------------------------
   * AI CAREER ROADMAP
   * -----------------------------------------
   */

  if (section === 'learn') {
    return (
      <div className="p-4 lg:p-6 max-w-[1600px]">
        <Roadmap />
      </div>
    );
  }

  /*
   * -----------------------------------------
   * SKILL DEPENDENCY GRAPH
   * -----------------------------------------
   */

  if (section === 'graph') {
    return (
      <div className="p-4 lg:p-6 max-w-[1600px]">
        <Header
          eyebrow="Student · Dependencies"
          title="Skill dependency graph"
        />

        <Roadmap />
      </div>
    );
  }

  /*
   * -----------------------------------------
   * ASSESSMENTS
   * -----------------------------------------
   */

  if (section === 'assessments') {
    return (
      <div className="p-6 lg:p-10 max-w-6xl">
        <Header
          eyebrow="Student · Assessment"
          title="Test & assessment"
        />

        <div className="grid md:grid-cols-3 gap-4">
          <Stat
            value={String(assessments.length)}
            label="Assessments completed"
          />

          <Stat
            value={
              assessments.length
                ? `${Math.round(
                    assessments.reduce(
                      (sum, assessment) =>
                        sum +
                        Number(
                          assessment.score || 0
                        ),
                      0
                    ) /
                      assessments.length
                  )}`
                : '--'
            }
            label="Average score"
          />

          <Stat
            value="1"
            label="Recommended next"
          />
        </div>

        {assessments.length === 0 ? (
          <Card className="mt-5">
            <h3 className="font-semibold">
              No assessments completed yet
            </h3>

            <p className="muted text-sm mt-2">
              Complete an assessment to improve
              your SkillBridge career intelligence.
            </p>

            <button className="btn btn-primary mt-4">
              Start assessment
            </button>
          </Card>
        ) : (
          <Card className="mt-5">
            <h3 className="font-semibold mb-4">
              Your assessment history
            </h3>

            <div className="space-y-3">
              {assessments.map((assessment) => {
                const percentage =
                  assessment.maxScore > 0
                    ? Math.round(
                        (assessment.score /
                          assessment.maxScore) *
                          100
                      )
                    : 0;

                return (
                  <div
                    key={assessment.id}
                    className="border rounded-lg p-4"
                  >
                    <div className="flex justify-between gap-4">
                      <div>
                        <p className="font-medium">
                          {assessment.name}
                        </p>

                        {assessment.type && (
                          <p className="muted text-xs mt-1">
                            {assessment.type}
                          </p>
                        )}
                      </div>

                      <div className="mono text-sm">
                        {percentage}%
                      </div>
                    </div>

                    <div className="mt-3">
                      <Bar value={percentage} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        <Card className="mt-5">
          <h3 className="font-semibold">
            Practical system-design assessment
          </h3>

          <p className="muted text-sm mt-2">
            Evaluate trade-off reasoning through a
            real scenario.
          </p>

          <button className="btn btn-primary mt-4">
            Start assessment
          </button>
        </Card>
      </div>
    );
  }

  /*
   * -----------------------------------------
   * STUDENT DASHBOARD
   * -----------------------------------------
   */

  return (
    <div className="p-6 lg:p-10 max-w-6xl">
      <Header
        eyebrow={`Student · ${
          data.name || 'Profile'
        }`}
        title="Know your skills"
      />

      {error && (
        <Card className="mb-5">
          <p className="text-sm">
            {error}
          </p>
        </Card>
      )}

      <div className="grid md:grid-cols-3 gap-4 mb-5">
        <Stat
          value={String(confidenceScore)}
          label="Skill confidence"
        />

        <Stat
          value={`${verifiedSkills}/${skills.length}`}
          label="Skills at target"
        />

        <Stat
          value={String(skills.length)}
          label="Tracked skills"
        />
      </div>

      <Card>
        <div className="flex flex-wrap justify-between gap-3 mb-5">
          <div>
            <h3 className="font-semibold">
              Skill gap vs target role
            </h3>

            <p className="muted text-sm mt-1">
              Target role:{' '}
              <span className="font-medium">
                {data.targetRole ||
                  'Backend Developer'}
              </span>
            </p>
          </div>
        </div>

        {skills.length === 0 ? (
          <div className="border border-dashed rounded-lg p-6">
            <p className="font-medium">
              No skills tracked yet.
            </p>

            <p className="muted text-sm mt-1">
              Add your current skills below to
              start building your personalized
              career profile.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {skills.map((currentSkill) => (
              <div
                key={currentSkill.id || currentSkill.name}
              >
                <div className="flex justify-between text-sm mb-1">
                  <span>
                    {currentSkill.name}
                  </span>

                  <span className="mono text-xs muted">
                    {currentSkill.have}/
                    {currentSkill.need}
                  </span>
                </div>

                <Bar
                  value={Number(
                    currentSkill.have || 0
                  )}
                  need={Number(
                    currentSkill.need || 0
                  )}
                />
              </div>
            ))}
          </div>
        )}

        <div className="border-t mt-6 pt-5">
          <div className="flex flex-wrap gap-2">
            <input
              value={skill}
              onChange={(e) =>
                setSkill(e.target.value)
              }
              placeholder="Skill name"
              className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-40"
            />

            <input
              type="number"
              value={have}
              onChange={(e) =>
                setHave(e.target.value)
              }
              className="border rounded-lg px-3 py-2 text-sm w-24"
              min="0"
              max="100"
            />

            <input
              type="number"
              value={need}
              onChange={(e) =>
                setNeed(e.target.value)
              }
              className="border rounded-lg px-3 py-2 text-sm w-24"
              min="0"
              max="100"
            />

            <button
              className="btn btn-primary"
              onClick={add}
              disabled={savingSkill}
            >
              {savingSkill
                ? 'Saving...'
                : 'Add skill'}
            </button>
          </div>

          <p className="muted text-xs mt-2">
            Current level · Target level
          </p>
        </div>
      </Card>

      <Card className="mt-5">
        <h3 className="font-semibold">
          AI Skill Mentor
        </h3>

        <p className="muted text-sm mt-1">
          Ask for personalized guidance based on
          your target role, skills, and assessments.
        </p>

        <div className="flex gap-2 mt-3">
          <input
            value={chat}
            onChange={(e) =>
              setChat(e.target.value)
            }
            className="border rounded-lg px-3 py-2 text-sm flex-1"
            placeholder="What should I learn next?"
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                ask();
              }
            }}
          />

          <button
            className="btn btn-primary"
            onClick={ask}
            disabled={askingMentor}
          >
            {askingMentor
              ? 'Thinking...'
              : 'Ask'}
          </button>
        </div>

        {reply && (
          <p className="mt-4 text-sm bg-tealLight rounded-lg p-3">
            {reply}
          </p>
        )}
      </Card>
    </div>
  );
}