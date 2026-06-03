import { skillNodes, skillTreeCategories } from '../data/skillTree';
import { useGameStore } from '../store/useGameStore';

interface SkillTreePanelProps {
  onClose: () => void;
}

export function SkillTreePanel({ onClose }: SkillTreePanelProps) {
  const fragments = useGameStore((state) => state.fragments);
  const unlockedSkillNodes = useGameStore((state) => state.unlockedSkillNodes);
  const unlockSkillNode = useGameStore((state) => state.unlockSkillNode);

  return (
    <div className="skill-tree-backdrop">
      <section className="skill-tree-modal panel" aria-label="Skill Tree">
        <header className="skill-tree-header">
          <div>
            <p className="eyebrow">PERMANENT UPGRADES</p>
            <h1>Skill Tree</h1>
            <p>
              Spend <strong>{fragments.toLocaleString()} Fragment</strong> from Reboot to
              strengthen every run.
            </p>
          </div>
          <button className="modal-close" onClick={onClose} type="button">
            Close
          </button>
        </header>
        <div className="skill-tree-categories">
          {skillTreeCategories.map((category) => (
            <section className="skill-tree-category" key={category.id}>
              <h2>{category.name}</h2>
              {category.id === 'corner' ? (
                <p className="skill-tree-category-note">
                  Corner Hits require same-frame X/Y wall contact. Sensor nodes only improve Near
                  Corner guidance and do not widen true Corner Hit detection.
                </p>
              ) : null}
              {skillNodes
                .filter((skillNode) => skillNode.category === category.id)
                .map((skillNode) => {
                  const level = unlockedSkillNodes[skillNode.id] ?? 0;
                  const isComplete = level >= skillNode.maxLevel;
                  const prerequisitesMet = skillNode.requiredNodeIds.every(
                    (requiredId) => (unlockedSkillNodes[requiredId] ?? 0) > 0,
                  );
                  const canAfford = fragments >= skillNode.cost;
                  const prerequisites = skillNode.requiredNodeIds
                    .map(
                      (requiredId) =>
                        skillNodes.find((candidate) => candidate.id === requiredId)?.name ??
                        requiredId,
                    )
                    .join(', ');

                  return (
                    <article className={`skill-node${isComplete ? ' complete' : ''}`} key={skillNode.id}>
                      <div className="skill-node-title">
                        <h3>{skillNode.name}</h3>
                        <span>
                          Lv {level} / {skillNode.maxLevel}
                        </span>
                      </div>
                      <p>{skillNode.description}</p>
                      {!prerequisitesMet && <small>Locked: requires {prerequisites}</small>}
                      <button
                        disabled={!prerequisitesMet || !canAfford || isComplete}
                        onClick={() => unlockSkillNode(skillNode.id)}
                        type="button"
                      >
                        {isComplete
                          ? 'Unlocked'
                          : prerequisitesMet
                            ? `Unlock - ${skillNode.cost} Fragment`
                            : 'Locked'}
                      </button>
                    </article>
                  );
                })}
            </section>
          ))}
        </div>
      </section>
    </div>
  );
}
