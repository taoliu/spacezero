import type {
  ContentDB,
  EnemyArchetypeDef,
  StageDef,
  UpgradeDef,
  WeaponDef,
} from './schemas';

export type ContentSources = {
  weapons: string;
  upgrades: string;
  enemies: string;
  stages: string;
};

export type RawContent = {
  weapons: unknown;
  upgrades: unknown;
  enemies: unknown;
  stages: unknown;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const fail = (source: string, path: string, message: string): never => {
  throw new Error(`[Content] ${source} ${path}: ${message}`);
};

const expectArray = (value: unknown, source: string, path: string): unknown[] => {
  if (!Array.isArray(value)) {
    fail(source, path, 'expected array');
  }
  return value as unknown[];
};

const expectRecord = (value: unknown, source: string, path: string): Record<string, unknown> => {
  if (!isRecord(value)) {
    fail(source, path, 'expected object');
  }
  return value as Record<string, unknown>;
};

const expectString = (value: unknown, source: string, path: string): string => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    fail(source, path, 'expected non-empty string');
  }
  return value as string;
};

const expectNumber = (value: unknown, source: string, path: string): number => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    fail(source, path, 'expected number');
  }
  return value as number;
};

const expectEnum = <T extends string>(
  value: unknown,
  allowed: readonly T[],
  source: string,
  path: string,
): T => {
  const stringValue = expectString(value, source, path);
  if (!allowed.includes(stringValue as T)) {
    fail(source, path, `invalid value '${stringValue}'`);
  }
  return stringValue as T;
};

const ensureUniqueIds = (entries: { id: string }[], source: string, label: string): void => {
  const seen = new Set<string>();
  for (const entry of entries) {
    if (seen.has(entry.id)) {
      fail(source, label, `duplicate id '${entry.id}'`);
    }
    seen.add(entry.id);
  }
};

const parseWeapons = (value: unknown, source: string): WeaponDef[] => {
  const entries = expectArray(value, source, 'weapons');
  const weapons: WeaponDef[] = [];
  for (const entry of entries) {
    const record = expectRecord(entry, source, 'weapons[]');
    const id = expectString(record.id, source, `weapons.${String(record.id ?? 'unknown')}.id`);
    const name = expectString(record.name, source, `weapons.${id}.name`);
    const type = expectEnum(record.type, ['laser', 'missile'] as const, source, `weapons.${id}.type`);

    if (type === 'laser') {
      weapons.push({
        id,
        name,
        type,
        baseDamage: expectNumber(record.baseDamage, source, `weapons.${id}.baseDamage`),
        fireRate: expectNumber(record.fireRate, source, `weapons.${id}.fireRate`),
        heatPerShot: expectNumber(record.heatPerShot, source, `weapons.${id}.heatPerShot`),
        coolRate: expectNumber(record.coolRate, source, `weapons.${id}.coolRate`),
      });
    } else {
      weapons.push({
        id,
        name,
        type,
        baseDamage: expectNumber(record.baseDamage, source, `weapons.${id}.baseDamage`),
        lockTime: expectNumber(record.lockTime, source, `weapons.${id}.lockTime`),
        ammoMax: expectNumber(record.ammoMax, source, `weapons.${id}.ammoMax`),
        reloadTime: expectNumber(record.reloadTime, source, `weapons.${id}.reloadTime`),
      });
    }
  }

  ensureUniqueIds(weapons, source, 'weapons');
  return weapons;
};

const parseUpgrades = (value: unknown, source: string): UpgradeDef[] => {
  const entries = expectArray(value, source, 'upgrades');
  const upgrades: UpgradeDef[] = [];

  for (const entry of entries) {
    const record = expectRecord(entry, source, 'upgrades[]');
    const id = expectString(record.id, source, `upgrades.${String(record.id ?? 'unknown')}.id`);
    const name = expectString(record.name, source, `upgrades.${id}.name`);
    const cost = expectNumber(record.cost, source, `upgrades.${id}.cost`);
    const effectsRaw = expectArray(record.effects, source, `upgrades.${id}.effects`);

    const effects = effectsRaw.map((effect, index) => {
      const effectRecord = expectRecord(effect, source, `upgrades.${id}.effects.${index}`);
      return {
        target: expectEnum(
          effectRecord.target,
          ['weapon', 'ship', 'targeting'] as const,
          source,
          `upgrades.${id}.effects.${index}.target`,
        ),
        stat: expectString(effectRecord.stat, source, `upgrades.${id}.effects.${index}.stat`),
        op: expectEnum(
          effectRecord.op,
          ['add', 'mul', 'set'] as const,
          source,
          `upgrades.${id}.effects.${index}.op`,
        ),
        value: expectNumber(effectRecord.value, source, `upgrades.${id}.effects.${index}.value`),
      };
    });

    upgrades.push({ id, name, cost, effects });
  }

  ensureUniqueIds(upgrades, source, 'upgrades');
  return upgrades;
};

const parseEnemies = (value: unknown, source: string): EnemyArchetypeDef[] => {
  const entries = expectArray(value, source, 'enemies');
  const enemies: EnemyArchetypeDef[] = [];

  for (const entry of entries) {
    const record = expectRecord(entry, source, 'enemies[]');
    const id = expectString(record.id, source, `enemies.${String(record.id ?? 'unknown')}.id`);
    const name = expectString(record.name, source, `enemies.${id}.name`);
    const stats = expectRecord(record.stats, source, `enemies.${id}.stats`);
    const ai = expectRecord(record.ai, source, `enemies.${id}.ai`);
    const weaponsRaw = expectArray(record.weapons, source, `enemies.${id}.weapons`);

    const weapons = weaponsRaw.map((weaponId, index) =>
      expectString(weaponId, source, `enemies.${id}.weapons.${index}`),
    );

    const countersRaw = record.counters;
    const counters = Array.isArray(countersRaw)
      ? countersRaw.map((counter, index) =>
          expectString(counter, source, `enemies.${id}.counters.${index}`),
        )
      : undefined;

    enemies.push({
      id,
      name,
      stats: {
        maxHp: expectNumber(stats.maxHp, source, `enemies.${id}.stats.maxHp`),
        shield: expectNumber(stats.shield, source, `enemies.${id}.stats.shield`),
        speed: expectNumber(stats.speed, source, `enemies.${id}.stats.speed`),
      },
      weapons,
      ai: {
        behavior: expectString(ai.behavior, source, `enemies.${id}.ai.behavior`),
        aggression: expectNumber(ai.aggression, source, `enemies.${id}.ai.aggression`),
        preferredRange: expectNumber(ai.preferredRange, source, `enemies.${id}.ai.preferredRange`),
        orbitStrength: expectNumber(ai.orbitStrength, source, `enemies.${id}.ai.orbitStrength`),
        dodgeRate: expectNumber(ai.dodgeRate, source, `enemies.${id}.ai.dodgeRate`),
        bravery: expectNumber(ai.bravery, source, `enemies.${id}.ai.bravery`),
      },
      counters,
    });
  }

  ensureUniqueIds(enemies, source, 'enemies');
  return enemies;
};

const parseStages = (value: unknown, source: string): StageDef[] => {
  const entries = expectArray(value, source, 'stages');
  const stages: StageDef[] = [];

  for (const entry of entries) {
    const record = expectRecord(entry, source, 'stages[]');
    const id = expectString(record.id, source, `stages.${String(record.id ?? 'unknown')}.id`);
    const name = expectString(record.name, source, `stages.${id}.name`);
    const arena = expectRecord(record.arena, source, `stages.${id}.arena`);
    const enemiesRaw = expectArray(record.enemies, source, `stages.${id}.enemies`);
    const objectivesRaw = expectArray(record.objectives, source, `stages.${id}.objectives`);
    const rewards = expectRecord(record.rewards, source, `stages.${id}.rewards`);

    const enemies = enemiesRaw.map((enemy, index) => {
      const enemyRecord = expectRecord(enemy, source, `stages.${id}.enemies.${index}`);
      return {
        archetypeId: expectString(
          enemyRecord.archetypeId,
          source,
          `stages.${id}.enemies.${index}.archetypeId`,
        ),
        count: expectNumber(enemyRecord.count, source, `stages.${id}.enemies.${index}.count`),
      };
    });

    const objectives = objectivesRaw.map((objective, index) => {
      const objectiveRecord = expectRecord(objective, source, `stages.${id}.objectives.${index}`);
      return {
        type: expectEnum(
          objectiveRecord.type,
          ['KillAll'] as const,
          source,
          `stages.${id}.objectives.${index}.type`,
        ),
      };
    });

    const reinforcementsRaw = record.reinforcements;
    const reinforcements = Array.isArray(reinforcementsRaw)
      ? reinforcementsRaw.map((reinforcement, index) => {
          const reinforcementRecord = expectRecord(
            reinforcement,
            source,
            `stages.${id}.reinforcements.${index}`,
          );
          return {
            delay: expectNumber(
              reinforcementRecord.delay,
              source,
              `stages.${id}.reinforcements.${index}.delay`,
            ),
            archetypeId: expectString(
              reinforcementRecord.archetypeId,
              source,
              `stages.${id}.reinforcements.${index}.archetypeId`,
            ),
            count: expectNumber(
              reinforcementRecord.count,
              source,
              `stages.${id}.reinforcements.${index}.count`,
            ),
          };
        })
      : undefined;

    const rewardsUpgradesRaw = rewards.upgrades;
    const rewardsUpgrades = Array.isArray(rewardsUpgradesRaw)
      ? rewardsUpgradesRaw.map((upgrade, index) =>
          expectString(upgrade, source, `stages.${id}.rewards.upgrades.${index}`),
        )
      : undefined;

    const spawnDistanceMin = record.spawnDistanceMin !== undefined
      ? expectNumber(record.spawnDistanceMin, source, `stages.${id}.spawnDistanceMin`)
      : undefined;
    const spawnDistanceMax = record.spawnDistanceMax !== undefined
      ? expectNumber(record.spawnDistanceMax, source, `stages.${id}.spawnDistanceMax`)
      : undefined;

    if (
      spawnDistanceMin !== undefined &&
      spawnDistanceMax !== undefined &&
      spawnDistanceMax < spawnDistanceMin
    ) {
      fail(source, `stages.${id}.spawnDistanceMax`, 'must be >= spawnDistanceMin');
    }

    stages.push({
      id,
      name,
      arena: {
        radius: expectNumber(arena.radius, source, `stages.${id}.arena.radius`),
      },
      spawnDistanceMin,
      spawnDistanceMax,
      enemies,
      objectives,
      rewards: {
        credits: expectNumber(rewards.credits, source, `stages.${id}.rewards.credits`),
        upgrades: rewardsUpgrades,
      },
      reinforcements,
    });
  }

  ensureUniqueIds(stages, source, 'stages');
  return stages;
};

const validateReferences = (content: ContentDB, sources: ContentSources): void => {
  const weaponIds = new Set(content.weapons.map((weapon) => weapon.id));
  for (const enemy of content.enemies) {
    for (const weaponId of enemy.weapons) {
      if (!weaponIds.has(weaponId)) {
        fail(sources.enemies, `enemies.${enemy.id}.weapons`, `unknown weapon id '${weaponId}'`);
      }
    }
  }

  const enemyIds = new Set(content.enemies.map((enemy) => enemy.id));
  for (const stage of content.stages) {
    for (const enemy of stage.enemies) {
      if (!enemyIds.has(enemy.archetypeId)) {
        fail(sources.stages, `stages.${stage.id}.enemies`, `unknown enemy id '${enemy.archetypeId}'`);
      }
    }

    if (stage.reinforcements) {
      for (const reinforcement of stage.reinforcements) {
        if (!enemyIds.has(reinforcement.archetypeId)) {
          fail(
            sources.stages,
            `stages.${stage.id}.reinforcements`,
            `unknown enemy id '${reinforcement.archetypeId}'`,
          );
        }
      }
    }
  }

  const upgradeIds = new Set(content.upgrades.map((upgrade) => upgrade.id));
  for (const stage of content.stages) {
    if (!stage.rewards.upgrades) {
      continue;
    }

    for (const upgradeId of stage.rewards.upgrades) {
      if (!upgradeIds.has(upgradeId)) {
        fail(sources.stages, `stages.${stage.id}.rewards.upgrades`, `unknown upgrade id '${upgradeId}'`);
      }
    }
  }
};

export const validateContent = (raw: RawContent, sources: ContentSources): ContentDB => {
  const weapons = parseWeapons(raw.weapons, sources.weapons);
  const upgrades = parseUpgrades(raw.upgrades, sources.upgrades);
  const enemies = parseEnemies(raw.enemies, sources.enemies);
  const stages = parseStages(raw.stages, sources.stages);

  const content: ContentDB = {
    weapons,
    upgrades,
    enemies,
    stages,
  };

  validateReferences(content, sources);

  return content;
};

export class ContentLoader {
  private async loadJson(url: URL, label: string): Promise<unknown> {
    let response: Response;
    try {
      response = await fetch(url.toString(), { cache: 'no-store' });
    } catch (error) {
      throw new Error(`[Content] ${label}: fetch failed (${String(error)})`);
    }

    if (!response.ok) {
      throw new Error(`[Content] ${label}: HTTP ${response.status}`);
    }

    try {
      return await response.json();
    } catch (error) {
      throw new Error(`[Content] ${label}: invalid JSON (${String(error)})`);
    }
  }

  async loadAll(): Promise<ContentDB> {
    const sources: ContentSources = {
      weapons: 'content/weapons.json',
      upgrades: 'content/upgrades.json',
      enemies: 'content/enemies.json',
      stages: 'content/stages/stage_001.json',
    };

    const [weaponsRaw, upgradesRaw, enemiesRaw, stageRaw] = await Promise.all([
      this.loadJson(new URL('../../../content/weapons.json', import.meta.url), sources.weapons),
      this.loadJson(new URL('../../../content/upgrades.json', import.meta.url), sources.upgrades),
      this.loadJson(new URL('../../../content/enemies.json', import.meta.url), sources.enemies),
      this.loadJson(new URL('../../../content/stages/stage_001.json', import.meta.url), sources.stages),
    ]);

    return validateContent(
      {
        weapons: weaponsRaw,
        upgrades: upgradesRaw,
        enemies: enemiesRaw,
        stages: [stageRaw],
      },
      sources,
    );
  }
}
