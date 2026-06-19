import {
  getCharacterSkillNodesByCharacterId,
  memorySlimeCharacterId,
} from '../data/skills';
import { resolveCharacterSkillEffects } from '../game/characterSkillEffects';
import { useGameStore } from '../store/useGameStore';

interface SkillTreeModalProps {
  onClose: () => void;
}

const branchLabels = {
  archive: 'Archive',
  corner: 'Corner',
  memory: 'Memory',
  motion: 'Motion',
};

function formatEffect(type: string, value: number): string {
  if (type === 'near_corner_distance_bonus') {
    return `Near Corner +${value}`;
  }

  const percent = Math.round((value - 1) * 100);
  if (type === 'bounce_reward_multiplier') return `Wall Memory +${percent}%`;
  if (type === 'corner_reward_multiplier') return `Corner +${percent}%`;
  if (type === 'visual_speed_multiplier') return `Speed +${percent}%`;
  if (type === 'offline_reward_multiplier') return `Offline +${percent}%`;
  return `${type} ${value}`;
}

export function SkillTreeModal({ onClose }: SkillTreeModalProps) {
  const characterId = memorySlimeCharacterId;
  const fragments = useGameStore((state) => state.fragments);
  const characterSkillLevels = useGameStore((state) => state.characterSkillLevels);
  const unlockCharacterSkillNode = useGameStore((state) => state.unlockCharacterSkillNode);
  const nodes = getCharacterSkillNodesByCharacterId(characterId);
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const levels = characterSkillLevels[characterId] ?? {};
  const resolved = resolveCharacterSkillEffects(characterSkillLevels, characterId);

  return (
    <div className="skill-tree-backdrop">
      <section className="skill-tree-modal character-skill-modal panel" aria-label="Memory Slime Skill Tree">
        <header className="skill-tree-header">
          <div>
            <p className="eyebrow">MEMORY SLIME</p>
            <h1>Slime Skill Tree</h1>
            <p>
              Spend <strong>{fragments.toLocaleString()} Fragment</strong> to shape the temporary
              Memory Slime into a stronger bouncing partner.
            </p>
          </div>
          <button className="modal-close" onClick={onClose} type="button">
            Close
          </button>
        </header>

        <div className="character-skill-summary" aria-label="Resolved skill effects">
          <span>Wall x{resolved.bounceRewardMultiplier.toFixed(2)}</span>
          <span>Corner x{resolved.cornerRewardMultiplier.toFixed(2)}</span>
          <span>Speed x{resolved.visualSpeedMultiplier.toFixed(2)}</span>
          <span>Offline x{resolved.offlineRewardMultiplier.toFixed(2)}</span>
          <span>Near +{resolved.nearCornerDistanceBonus}</span>
        </div>

        <div className="character-skill-tree" role="list">
          <svg className="character-skill-lines" viewBox="0 0 1040 520" aria-hidden="true">
            {nodes.flatMap((node) =>
              node.prerequisites.flatMap((requiredId) => {
                const requiredNode = nodeById.get(requiredId);
                if (!requiredNode) {
                  return [];
                }

                const isActive = (levels[requiredNode.id] ?? 0) > 0;
                return (
                  <line
                    className={isActive ? 'active' : undefined}
                    key={`${requiredId}:${node.id}`}
                    x1={requiredNode.position.x + 60}
                    x2={node.position.x + 60}
                    y1={requiredNode.position.y + 44}
                    y2={node.position.y + 44}
                  />
                );
              }),
            )}
          </svg>
          {nodes.map((node) => {
            const level = levels[node.id] ?? 0;
            const acquired = level >= node.maxLevel;
            const prerequisitesMet = node.prerequisites.every(
              (requiredId) => (levels[requiredId] ?? 0) > 0,
            );
            const canAfford = fragments >= node.cost;
            const unlockable = prerequisitesMet && canAfford && !acquired;
            const locked = !prerequisitesMet;
            const state = acquired ? 'acquired' : unlockable ? 'unlockable' : locked ? 'locked' : 'waiting';
            const prerequisites = node.prerequisites
              .map((requiredId) => nodeById.get(requiredId)?.name ?? requiredId)
              .join(', ');

            return (
              <article
                className={`character-skill-node ${state}`}
                key={node.id}
                role="listitem"
                style={{ left: node.position.x, top: node.position.y }}
              >
                <div className="character-skill-node-heading">
                  <span>{branchLabels[node.branch]}</span>
                  <strong>
                    Lv {level} / {node.maxLevel}
                  </strong>
                </div>
                <h2>{node.name}</h2>
                <p>{node.description}</p>
                <small>{node.effects.map((effect) => formatEffect(effect.type, effect.value)).join(' / ')}</small>
                {locked ? <small>Requires {prerequisites}</small> : null}
                <button
                  disabled={!unlockable}
                  onClick={() => unlockCharacterSkillNode(characterId, node.id)}
                  type="button"
                >
                  {acquired ? 'Acquired' : locked ? 'Locked' : `Learn - ${node.cost} Fragment`}
                </button>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
