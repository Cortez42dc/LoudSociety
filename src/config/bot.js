import { logger } from '../utils/logger.js';

// LOUD SOCIETY — merged configuration in the format of your original file.
// Load dotenv BEFORE importing this module. Keep secrets in .env.
// This file supplies settings; command/event/database modules must consume them.
// New sections do not create commands, SQLite tables, banners, or role checks.
// The supplied welcome artwork is included under assets/welcome; set server IDs.
// Nothing is auto-created in Discord.

const envId = (key) => process.env[key]?.trim() || null;
const envIds = (key) => [...new Set(
  (process.env[key] || '').split(',').map((id) => id.trim()).filter(Boolean),
)];

const STATUS_LABELS = Object.freeze({
  online: '🔥 Lit',
  idle: '😎 Vibin',
  dnd: '💨 Smokin One',
  invisible: '💤 AFK',
});

export const botConfig = {
  // =========================
  // LOUD SOCIETY BRANDING
  // =========================
  branding: {
    name: 'LOUD SOCIETY',
    memberName: 'Sprout',
    memberNamePlural: 'Sprouts',
    description: 'Growing knowledge. Building community.',
  },

  // =========================
  // LOUD SOCIETY BOT STATUS
  // =========================
  // Choose ONE: online = 🔥 Lit, idle = 😎 Vibin,
  // dnd = 💨 Smokin One, invisible = 💤 AFK.
  // Set BOT_STATUS in .env or change the fallback below.
  // The only activity is this custom label, including its emoji. No rotation.
  // Discord keeps its built-in dot. Invisible appears offline; the client may
  // hide the custom label. Do not attempt to override that behavior.
  presence: {
    status: process.env.BOT_STATUS?.trim().toLowerCase() || 'online',
    // Derived from status so changing the selection cannot leave a stale label.
    get activities() {
      return getBotPresence(this.status).activities;
    },
  },

  // =========================
  // COMMAND BEHAVIOR
  // =========================
  commands: {
    owners: envIds('OWNER_IDS'),
    defaultCooldown: 3, // Seconds.
    deleteCommands: false,
    guildId: envId('GUILD_ID'),
    testGuildId: envId('TEST_GUILD_ID'),
    maintenanceMode: process.env.MAINTENANCE_MODE === 'true',
    prefix: process.env.PREFIX || '!',
    slashCommands: true,
    // Only this prefix command is intended; no generic prefix-command pack.
    allowedPrefixCommands: ['testwelcome'],
    // Command modules/registration must enforce this allowlist.
    allowedSlashCommands: [
      'warn', 'timeout', 'kick', 'ban', 'unban', 'purge', 'slowmode', 'lock', 'unlock',
      'rank', 'leaderboard', 'battle', 'grower', 'giveaway',
      'vpd', 'dli', 'ecconvert', 'tempconvert', 'ping', 'status',
      'setup', // Admin panel/channel configuration and leveling toggle.
    ],
    defaultAllowedMentions: { parse: [], repliedUser: false },
    cooldowns: {
      enabled: true,
      scope: 'guild-member-action',
      // Seconds; omitted commands use defaultCooldown above.
      seconds: {
        ping: 5, status: 10, vpd: 5, dli: 5, ecconvert: 5, tempconvert: 5,
        rank: 10, leaderboard: 15, battle: 30, grower: 30,
        giveaway: 30, setup: 5,
      },
      // Applies to buttons/select menus too, not just slash commands.
      interactionSeconds: {
        ticketCreate: 60, ticketAction: 5, giveawayEntry: 3,
        battleVote: 3, growerVote: 3, onboarding: 5,
      },
      bypassOwners: false,
      maximumEntries: 10000,
      pruneExpiredOnAccess: true,
      rejectNewKeysAtCapacity: true,
      atomicCheckAndReserve: true,
    },
  },

  // =========================
  // EMBED COLORS & BRANDING
  // =========================
  // Single source of truth for embed colors.
  embeds: {
    colors: {
      primary: '#14532D',
      secondary: '#111111',
      gold: '#D4AF37',
      purple: '#7E57C2',
      success: '#57F287',
      error: '#ED4245',
      warning: '#FEE75C',
      info: '#3498DB',
      light: '#FFFFFF',
      dark: '#0B0D0B',
      gray: '#99AAB5',
      blurple: '#5865F2',
      green: '#57F287',
      yellow: '#FEE75C',
      fuchsia: '#EB459E',
      red: '#ED4245',
      black: '#000000',
      moderation: '#7E57C2',
      onboarding: '#14532D',
      leveling: '#D4AF37',
      battle: '#7E57C2',
      growerMonth: '#D4AF37',
      giveaway: { active: '#14532D', ended: '#99AAB5' },
      ticket: {
        open: '#57F287', claimed: '#D4AF37', closed: '#ED4245', pending: '#99AAB5',
      },
      priority: {
        none: '#99AAB5', low: '#57F287', medium: '#D4AF37',
        high: '#FEE75C', urgent: '#ED4245',
      },
    },
    footer: { text: 'LOUD SOCIETY', icon: null },
    thumbnail: null,
    author: { name: null, icon: null, url: null },
  },

  // =========================
  // SQLITE / PERSISTENT DATA
  // =========================
  // The database module must apply these settings and implement transactions.
  // There is no PostgreSQL requirement in this configuration.
  database: {
    driver: 'sqlite',
    filename: process.env.SQLITE_PATH?.trim() || './database/loud-society.sqlite',
    foreignKeys: true,
    journalMode: 'WAL',
    busyTimeoutMs: 5000,
    synchronous: 'FULL', // Commit durable state during normal operation.
    persist: [
      'sproutAssignments', 'highestSproutNumber', 'warnings', 'xpLevels',
      'onboardingStatus', 'selectedSelfRoles', 'tickets', 'battles',
      'giveaways', 'growerMonth', 'botConfiguration',
    ],
    backup: {
      enabled: true,
      directory: process.env.BACKUP_DIRECTORY?.trim() || './database/backups',
      intervalMs: 24 * 60 * 60 * 1000,
      keepLast: 7,
      // Use the SQLite driver's online backup API, NEVER copy an open .sqlite
      // file alone: committed changes can still be in its WAL file.
      // https://sqlite.org/backup.html
      method: 'sqlite-online-backup',
      runAfterSuccessfulStartupCheck: true,
      runBeforeSchemaMigration: true,
      allowOverlappingJobs: false,
      verifySnapshot: 'quick_check',
      writeTemporaryFileThenRename: true,
      pruneOnlyAfterVerifiedBackup: true,
      pruneOnlyFilesCreatedByThisBot: true,
      automaticRestore: false,
      manualAccess: 'owner-admin',
      // A local backup helps recover data; it does not protect against disk loss.
    },
  },

  // =========================
  // STAFF & PERMISSION POLICY
  // =========================
  // These IDs identify existing staff roles; the bot must not grant them.
  permissions: {
    adminRoles: envIds('ADMIN_ROLE_IDS'), // Trusted head staff ONLY.
    moderatorRoles: envIds('MODERATOR_ROLE_IDS'),
    management: {
      // Call canManageBot(fetchedGuildMember) before EVERY protected command,
      // button, select menu, and modal submission. Never trust a custom ID alone.
      access: 'owner-admin', // OWNER_IDS or ADMIN_ROLE_IDS only.
      protectedActions: [
        'settings', 'presence', 'panels', 'counters', 'onboarding-setup',
        'welcome-setup', 'ticket-setup', 'leveling-toggle', 'giveaway-management',
        'backups',
      ],
      allowModerators: false,
      allowUnconfiguredDiscordAdministrators: false,
      requireConfiguredGuild: true,
      fetchMemberBeforeCheck: true,
      checkEveryInteraction: true,
      // Only these non-security settings may be changed/persisted through the bot.
      editableConfigPaths: [
        'presence.status', 'features.leveling', 'features.counter',
        'welcome.defaultWelcomeChannel', 'tickets.panelChannel',
        'tickets.defaultCategory', 'tickets.archiveCategory',
        'onboarding.panelChannel', 'onboarding.rulesChannel',
        'counters.sprouts.channelId', 'counters.boosts.channelId',
        'counters.boosts.enabled',
      ],
      // Do not load arbitrary config overrides from SQLite. Owner/staff IDs,
      // permission policy, role assignments, paths, and secrets stay file-only.
      validateChangesBeforeSaving: true,
      rejectUnlistedConfigPaths: true,
    },
    respectRoleHierarchy: true,
    ownerBypassesRoleHierarchy: false,
    autoCreateRoles: false,
    requestAdministrator: false,
    // discord.js v14 permission names; add only the permissions in use.
    botPermissions: [
      'ViewChannel', 'SendMessages', 'ReadMessageHistory', 'EmbedLinks',
      'AttachFiles', 'ManageChannels', 'ManageRoles', 'ManageMessages',
      'ModerateMembers', 'KickMembers', 'BanMembers',
    ],
    // Runtime must check real role permissions immediately before assignment.
    // An allowlist rejects management permissions AND unknown future flags.
    communityRoleAllowedPermissions: [
      'ViewChannel', 'SendMessages', 'SendMessagesInThreads', 'ReadMessageHistory',
      'AddReactions', 'EmbedLinks', 'AttachFiles', 'UseExternalEmojis',
      'UseExternalStickers', 'Connect', 'Speak', 'UseVAD', 'ChangeNickname',
      'UseApplicationCommands', 'Stream', 'RequestToSpeak',
    ],
    // Permission-free interest roles are preferred. Normal access can come
    // from the manually configured Sprout role and channel overwrites.
    communityRoleSafety: {
      rejectManagedRoles: true,
      rejectEveryoneRole: true,
      rejectStaffRoles: true,
      rejectRolesAtOrAboveBot: true,
      checkChannelOverwrites: true,
      recheckBeforeEveryAssignment: true,
      onUnsafeRole: 'refuse-and-log',
    },
  },

  // =========================
  // BASIC MODERATION
  // =========================
  moderation: {
    logChannel: envId('MOD_LOG_CHANNEL_ID'), // Optional.
    requireReason: true,
    confirmations: true,
    // Configured staff status alone must never bypass Discord permissions.
    requireDiscordPermissions: true,
    commandPermissions: {
      warn: ['ModerateMembers'],
      timeout: ['ModerateMembers'],
      kick: ['KickMembers'],
      ban: ['BanMembers'],
      unban: ['BanMembers'],
      purge: ['ManageMessages'],
      slowmode: ['ManageChannels'],
      lock: ['ManageChannels'],
      unlock: ['ManageChannels'],
    },
    timeout: { maximumMs: 28 * 24 * 60 * 60 * 1000 },
    purge: { minimum: 1, maximum: 100, skipMessagesOlderThanDays: 14 },
    slowmode: { minimumSeconds: 0, maximumSeconds: 21600 },
    lock: { savePreviousOverwrites: true, restorePreviousOverwritesOnUnlock: true },
    warnings: { persist: true, automaticPunishments: false },
  },

  // =========================
  // WELCOME / PERMANENT SPROUT NUMBERS
  // =========================
  welcome: {
    defaultWelcomeChannel: envId('WELCOME_CHANNEL_ID'),
    // {user} is the Discord mention; {sproutNumber} is the saved integer.
    defaultWelcomeMessage:
      '{user} just joined the Society 🌱\nWelcome, Sprout #{sproutNumber}. Smoke one, talk grow, share game, and make yourself at home.',
    defaultReturningMessage:
      '{user} — Sprout #{sproutNumber} has returned 🌱\nWelcome back to the Society. Smoke one, talk grow, share game, and make yourself at home.',
    // Choose the returning message from the saved assignment, never join order.
    distinguishReturningMembers: true,
    postBannerAndMessageTogether: true,
    grantSproutRoleOnJoin: false, // The Join Loud Society onboarding button does this.
    defaultGoodbyeChannel: null,
    defaultGoodbyeMessage: '{user} has left LOUD SOCIETY.',
    goodbyeEnabled: false,
    ignoreBots: true,
    banner: {
      // Original supplied PNG, copied without alteration. Path is from bot root.
      // The renderer still needs to be implemented; this does not edit the image.
      artworkPath: process.env.WELCOME_ARTWORK_PATH?.trim() || './assets/welcome/loud-society.png',
      preserveExistingDesign: true,
      preserveOriginalDimensions: true,
      replaceOnly: ['discord-icon-circle', 'username-placeholder', 'sprout-number'],
      preserveAvatarCircleBorder: true,
      avatarShape: 'circle',
      usernameTemplate: '@{username}',
      fitLongUsernamesInsideExistingPlate: true,
      useRealDiscordAvatar: true,
      useRealDiscordUsername: true,
      renderAvatarOnImage: true,
      renderUsernameOnImage: true,
      renderSproutNumberOnImage: true,
      numberTemplate: 'SPROUT #{sproutNumber}',
    },
    sproutNumbers: {
      firstNumber: 1,
      padding: 0, // SPROUT #1, SPROUT #2, SPROUT #27. NEVER #0001.
      scope: 'guild',
      persist: true,
      lookupExistingAssignmentFirst: true,
      identityKey: ['guildId', 'discordUserId'],
      keepNumberOnRejoin: true,
      incrementOnRejoin: false,
      nextNumberSource: 'persisted-highest-issued-number-plus-one',
      useCurrentMemberCount: false,
      neverReuseNumbers: true,
      retainAssignmentsOnLeave: true,
      // SQLite: unique (guildId,userId) and (guildId,sproutNumber).
      // In ONE atomic transaction: first look up (guildId,userId). If found,
      // return that assignment without allocating or changing the high-water mark.
      // Otherwise, assign highestIssued + 1, save the assignment, and advance
      // highestIssued only when the transaction commits. Start highestIssued at 0.
      // Example: highestIssued=15; returning #10 remains #10 and leaves it at 15;
      // the next never-seen-before member receives #16. Rejoins never skip #16.
      // Retries for the same user must return their saved assignment, not allocate.
      allocation: 'atomic-transaction',
    },
    test: {
      enabled: process.env.NODE_ENV === 'development',
      command: '!testwelcome', // Exact text, independent of PREFIX.
      exactMatch: true,
      // Put ONLY your Discord user ID in OWNER_IDS for access only by you.
      // The handler must check isBotOwner(author.id) BEFORE rendering/fetching
      // preview members; canManageBot is too broad because it includes head staff.
      ownerOnly: true,
      allowAdminOrModeratorBypass: false,
      delivery: 'dm-to-command-owner',
      publicAcknowledgement: false,
      allowPublicFallback: false,
      onDeliveryFailure: 'log-error-without-posting-preview',
      labelPreviews: true,
      // The typed !testwelcome command is still visible in its server channel.
      // Only the preview banners are delivered privately. Never post them there.
      previewNumbers: [1, 2],
      secondMember: 'another-non-bot-or-tester',
      useRealAvatarAndUsername: true,
      // Preview rendering must NEVER call the real number allocator.
      persist: false,
      consumeSproutNumbers: false,
      updateCounters: false,
    },
  },

  // =========================
  // LEVELS / XP — OFF BY DEFAULT
  // =========================
  // features.leveling is the single enable/disable switch.
  leveling: {
    commands: ['rank', 'leaderboard'],
    adminCanToggle: true,
    toggleAccess: 'owner-admin',
    persistToggle: true,
    xpPerMessage: { minimum: 10, maximum: 15 },
    cooldownMs: 60 * 1000,
    minimumMessageLength: 15,
    ignoreBots: true,
    ignoreCommands: true,
    ignoreRepeatedMessages: true,
    duplicateWindowMs: 10 * 60 * 1000,
    excludedChannels: envIds('XP_EXCLUDED_CHANNEL_IDS'),
    // Total XP for level N: 100 * N^2. N starts at zero.
    xpBase: 100,
    announceLevelUps: false,
    rewards: [
      { level: 0, name: 'Sprout', roleId: null },
      { level: 5, name: 'Seedling', roleId: envId('SEEDLING_ROLE_ID') },
      { level: 10, name: 'Rooted', roleId: envId('ROOTED_ROLE_ID') },
      { level: 15, name: 'Vegetating', roleId: envId('VEGETATING_ROLE_ID') },
      { level: 20, name: 'Cultivator', roleId: envId('CULTIVATOR_ROLE_ID') },
      { level: 30, name: 'Flowering', roleId: envId('FLOWERING_ROLE_ID') },
      { level: 40, name: 'Harvester', roleId: envId('HARVESTER_ROLE_ID') },
      { level: 50, name: 'Master Grower', roleId: envId('MASTER_GROWER_ROLE_ID') },
    ],
    // Never award the access-granting Sprout role through XP.
    requireCompletedOnboarding: true,
    validateRewardRolesAsCommunityRoles: true,
  },

  // =========================
  // SUBMIT A TICKET
  // =========================
  tickets: {
    panelManagementAccess: 'owner-admin',
    panelChannel: envId('SUPPORT_CHANNEL_ID'),
    defaultCategory: envId('TICKET_CATEGORY_ID'),
    archiveCategory: envId('TICKET_ARCHIVE_CATEGORY_ID'),
    logChannel: envId('TICKET_LOG_CHANNEL_ID'),
    // Populated only with your manually configured staff roles.
    supportRoles: [...new Set([...envIds('ADMIN_ROLE_IDS'), ...envIds('MODERATOR_ROLE_IDS')])],
    panel: {
      title: 'SUBMIT A TICKET',
      description: 'Need server help? Open a private ticket. Please ask regular grow questions in the grow channels.',
      buttonText: 'Submit a Ticket',
      buttonEmoji: '🎫',
    },
    types: [
      { id: 'server-help', label: 'Server Help', emoji: '🛠️' },
      { id: 'member-report', label: 'Report a Member', emoji: '🚨' },
      { id: 'partnership', label: 'Partnership / Business', emoji: '🤝' },
      { id: 'other', label: 'Other', emoji: '❓' },
    ],
    actions: ['claim', 'close', 'reopen', 'delete'],
    maximumOpenPerMember: 1,
    channelName: 'ticket-{ticketNumber}',
    private: true,
    visibility: ['creator', 'bot', 'configured-staff'],
    // Create explicit overwrites; never inherit public category visibility.
    denyEveryoneViewChannel: true,
    synchronizeCategoryPermissions: false,
    staffOnlyActions: ['claim', 'reopen', 'delete'],
    creatorCanClose: true,
    requireDeleteConfirmation: true,
    transcript: { enabled: false },
    defaultPriority: 'none',
    priorities: {
      none: { emoji: '⚪', color: '#99AAB5', label: 'None' },
      low: { emoji: '🟢', color: '#57F287', label: 'Low' },
      medium: { emoji: '🟡', color: '#D4AF37', label: 'Medium' },
      high: { emoji: '🔴', color: '#FEE75C', label: 'High' },
      urgent: { emoji: '🚨', color: '#ED4245', label: 'Urgent' },
    },
  },

  // =========================
  // STRAIN BATTLES / COMMUNITY POLLS
  // =========================
  battles: {
    command: 'battle',
    staffOnlyCreation: true,
    choices: 2,
    defaultDuration: 24 * 60 * 60 * 1000,
    minimumDuration: 60 * 1000,
    maximumDuration: 30 * 24 * 60 * 60 * 1000,
    voting: 'buttons',
    oneVotePerMember: true,
    allowVoteChanges: true,
    ignoreBots: true,
    showTotalVotes: true,
    showPercentages: true,
    showWinner: true,
    tieBehavior: 'announce-tie',
    noVotesBehavior: 'announce-no-votes',
    persist: true,
    restoreAfterRestart: true,
  },

  // =========================
  // GROWER OF THE MONTH
  // =========================
  growerMonth: {
    commands: ['grower nominate', 'grower start', 'grower end'],
    staffOnlyManagement: true,
    votingChannel: envId('GROWER_VOTING_CHANNEL_ID'),
    announcementChannel: envId('GROWER_ANNOUNCEMENT_CHANNEL_ID'),
    // If unset, use the channel where staff start the contest.
    useCommandChannelWhenUnset: true,
    nominationSource: 'existing-discord-message-url',
    requireSameGuild: true,
    requirePostVisibleToVoters: true,
    copyOriginalPhotos: false,
    createPhotoChannel: false,
    maximumNominations: 25,
    oneNominationPerGrower: true,
    voting: 'select-menu',
    oneVotePerMember: true,
    allowVoteChanges: true,
    defaultVotingDuration: 7 * 24 * 60 * 60 * 1000,
    calendarTimezone: process.env.BOT_TIMEZONE || 'UTC',
    automaticMonthlyStart: false,
    winnerRole: envId('GROWER_WINNER_ROLE_ID'),
    winnerRoleName: '🏆 Grower of the Month',
    removeRoleFromPreviousWinner: true,
    validateWinnerRoleAsCommunityRole: true,
    tieBehavior: 'announce-tie-without-role-change',
    noVotesBehavior: 'announce-no-winner',
    persist: true,
    restoreAfterRestart: true,
  },

  // =========================
  // ONE ONBOARDING / VERIFICATION / SELF-ROLE FLOW
  // =========================
  onboarding: {
    setupAccess: 'owner-admin',
    panelChannel: envId('ONBOARDING_CHANNEL_ID'),
    rulesChannel: envId('RULES_CHANNEL_ID'),
    sproutRole: envId('SPROUT_ROLE_ID'),
    panel: {
      title: 'Welcome to LOUD SOCIETY',
      description: 'Read the server rules, then join the community and choose your roles.',
      buttonText: 'Join Loud Society',
      buttonEmoji: '🌱',
    },
    requireRulesAcknowledgement: true,
    grantSproutRoleOnButton: true,
    automaticVerificationOnJoin: false,
    captcha: false,
    applicationRequired: false,
    privateSetupResponses: true,
    allowMembersToUpdateSelections: true,
    onlyModifyConfiguredSelfRoles: true,
    questionOne: {
      title: 'What do you grow with?',
      minimumSelections: 1,
      maximumSelections: 1,
      replacePreviousSelection: true,
      options: [
        { id: 'hydro', label: 'Hydro', emoji: '💧', roleId: envId('HYDRO_ROLE_ID') },
        { id: 'coco', label: 'Coco', emoji: '🥥', roleId: envId('COCO_ROLE_ID') },
        { id: 'soil', label: 'Soil', emoji: '🟫', roleId: envId('SOIL_ROLE_ID') },
        { id: 'living-soil', label: 'Living Soil', emoji: '🪱', roleId: envId('LIVING_SOIL_ROLE_ID') },
        { id: 'learning', label: 'Still Learning / Not Growing Yet', emoji: '🌱', roleId: envId('LEARNING_ROLE_ID') },
      ],
    },
    questionTwo: {
      title: 'What are you into?',
      minimumSelections: 1,
      maximumSelections: 8,
      options: [
        { id: 'genetics', label: 'Genetics', emoji: '🧬', roleId: envId('GENETICS_ROLE_ID') },
        { id: 'growing', label: 'Growing', emoji: '🌱', roleId: envId('GROWING_ROLE_ID') },
        { id: 'rosin', label: 'Rosin', emoji: '🔥', roleId: envId('ROSIN_ROLE_ID') },
        { id: 'hash', label: 'Hash', emoji: '🧊', roleId: envId('HASH_ROLE_ID') },
        { id: 'edibles', label: 'Edibles', emoji: '🍪', roleId: envId('EDIBLES_ROLE_ID') },
        { id: 'infusions', label: 'Infusions', emoji: '🧈', roleId: envId('INFUSIONS_ROLE_ID') },
        { id: 'plant-science', label: 'Plant Science', emoji: '🧠', roleId: envId('PLANT_SCIENCE_ROLE_ID') },
        { id: 'culture', label: 'Cannabis Culture', emoji: '💨', roleId: envId('CULTURE_ROLE_ID') },
      ],
    },
    persist: true,
  },

  // Retain selected verification setting names from the original config.
  // Consumers must honor autoVerify.enabled and route verification to onboarding;
  // do not install a second join/role flow.
  verification: {
    handler: 'onboarding',
    defaultMessage: 'Read the rules, then press 🌱 Join Loud Society to become a Sprout.',
    defaultButtonText: '🌱 Join Loud Society',
    autoVerify: { enabled: false },
    verificationCooldown: 5000,
    maxVerificationAttempts: 3,
    attemptWindow: 60000,
    maxCooldownEntries: 10000,
    maxAttemptEntries: 10000,
    cooldownCleanupInterval: 300000,
    maxAuditMetadataBytes: 4096,
    maxInMemoryAuditEntries: 1000,
    logAllVerifications: true,
    keepAuditTrail: true,
  },

  // =========================
  // GIVEAWAYS — NO ECONOMY
  // =========================
  giveaways: {
    // Use /giveaway start so creation can coexist with end/reroll subcommands.
    // https://docs.discord.com/developers/interactions/application-commands
    commands: ['giveaway start', 'giveaway end', 'giveaway reroll'],
    managementAccess: 'owner-admin', // Creation, end, reroll, and settings.
    defaultDuration: 24 * 60 * 60 * 1000,
    minimumDuration: 5 * 60 * 1000,
    maximumDuration: 30 * 24 * 60 * 60 * 1000,
    minimumWinners: 1,
    maximumWinners: 10,
    allowedRoles: envIds('ADMIN_ROLE_IDS'), // Owners also qualify via canManageBot.
    bypassRoles: [],
    entryButtonText: 'Enter Giveaway',
    oneEntryPerMember: true,
    ignoreBots: true,
    requireCurrentMembershipAtDraw: true,
    excludePreviousWinnersOnReroll: true,
    allowEntryWithdrawal: true,
    selection: 'crypto-random-without-replacement',
    persist: true,
    restoreAfterRestart: true,
  },

  // =========================
  // OPTIONAL SERVER COUNTERS — OFF BY DEFAULT
  // =========================
  counters: {
    managementAccess: 'owner-admin',
    // Counts CURRENT members holding Sprout, never the highest issued number.
    sprouts: {
      channelId: envId('SPROUT_COUNTER_CHANNEL_ID'),
      channelName: '🌱 Sprouts: {count}',
      countSource: 'current-non-bot-members-with-sprout-role',
    },
    boosts: {
      enabled: false,
      channelId: envId('BOOST_COUNTER_CHANNEL_ID'),
      channelName: '🚀 Boosts: {count}',
      countSource: 'guild-premium-subscription-count',
    },
    type: 'voice', // 'voice' or 'text'.
    createChannelsAutomatically: false,
    updateOnRelevantEvents: true,
    updateOnlyWhenChanged: true,
    debounceMs: 30 * 1000,
    minimumUpdateIntervalMs: 10 * 60 * 1000,
    pollIntervalMs: 0,
  },

  // =========================
  // GROW CALCULATORS FOR CHAT
  // =========================
  grow: {
    commands: ['vpd', 'dli', 'ecconvert', 'tempconvert'],
    allowedChannels: [], // Empty means any channel with command access.
    shortResponses: true,
    vpd: {
      units: ['C', 'F'],
      outputUnit: 'kPa',
      decimalPlaces: 2,
      label: 'Estimated air VPD',
      explanation: 'Air VPD estimates the air’s drying demand. Leaf VPD may differ with leaf temperature.',
      relativeHumidity: { minimum: 0, maximum: 100 },
    },
    dli: {
      ppfdUnit: 'µmol/m²/s',
      outputUnit: 'mol/m²/day',
      decimalPlaces: 2,
      label: 'Estimated DLI',
      lightHours: { minimum: 0, maximum: 24 },
      assumeConstantPPFD: true,
    },
    ecconvert: {
      inputUnit: 'mS/cm',
      ppm500Multiplier: 500,
      ppm700Multiplier: 700,
      label: 'Approximate PPM — meter scale dependent',
    },
    tempconvert: { units: ['C', 'F'], decimalPlaces: 1 },
    rejectNonFiniteInputs: true,
    chemicalCalculators: false,
  },

  // =========================
  // LIGHTWEIGHT RUNTIME
  // =========================
  runtime: {
    gatewayIntents: ['Guilds', 'GuildMembers', 'GuildMessages'],
    // Request MessageContent only for XP or the development prefix command.
    // Resolve the persisted XP toggle before login. Enabling XP afterward needs
    // a reconnect/restart if MessageContent was omitted from the original login.
    conditionalGatewayIntents: {
      MessageContent: 'features.leveling || welcome.test.enabled',
    },
    scheduler: 'next-due-deadline',
    restorePersistedDeadlinesOnStartup: true,
    processOverdueEventsOnStartup: true,
    preventDuplicateCompletion: true,
    maximumTimerDelayMs: 2147483647,
    boundedCaches: true,
    logTokens: false,
  },

  // =========================
  // STARTUP SELF-CHECK — IMPLEMENT IN THE READY/STARTUP HANDLER
  // =========================
  startupChecks: {
    enabled: true,
    runBeforeAcceptingCommands: true,
    inspectOnlyEnabledFeatures: true,
    fetchConfiguredChannelsAndRoles: true,
    requireIdsForEnabledFeatures: true,
    verifyChannelTypes: true,
    verifyEffectiveChannelPermissions: true,
    verifyRoleHierarchy: true,
    verifyCommunityRoleSafety: true,
    verifyOwnerOrHeadStaffConfigured: true,
    verifyWelcomeArtwork: true,
    verifyWritableDatabaseBackupAndLogPaths: true,
    databaseIntegrityCheck: 'quick_check',
    reportTo: ['console', 'file'],
    includeConfigFieldNamesInErrors: true,
    onMissingRequiredResource: 'disable-affected-feature-and-report',
    onMissingOptionalResource: 'warn-and-skip-resource',
    onDatabaseFailure: 'abort-startup',
    recheckAfterAdminConfigChange: true,
    createMissingChannelsOrRoles: false,
    pollIntervalMs: 0,
  },

  // =========================
  // /PING AND /STATUS — ON-DEMAND HEALTH ONLY
  // =========================
  health: {
    commands: ['ping', 'status'],
    access: 'members',
    category: 'health',
    ephemeral: true,
    showUptime: true,
    showGatewayLatency: true,
    showBotProcessRam: true,
    ramUnit: 'MiB',
    showDatabaseReady: true,
    showStartupWarningsTo: 'owner-admin',
    exposeTokensPathsOrEnvironment: false,
    periodicReports: false,
  },

  // =========================
  // CLEAN LOCAL LOGS — SEPARATE FROM MODERATION LOG POSTS
  // =========================
  logging: {
    level: 'info',
    console: true,
    file: {
      enabled: true,
      directory: process.env.LOG_DIRECTORY?.trim() || './logs',
      filename: 'loud-society.log',
      maximumBytes: 5 * 1024 * 1024,
      keepFiles: 5,
    },
    timestamps: true,
    includeErrorStack: true,
    redactSecrets: true,
    sensitiveKeys: ['token', 'authorization', 'password', 'secret'],
    redactConfiguredSecretValues: true,
    logMessageContent: false,
    logFullInteractionPayloads: false,
    discordErrorChannel: null,
  },

  // =========================
  // GRACEFUL SHUTDOWN
  // =========================
  shutdown: {
    enabled: true,
    signals: ['SIGINT', 'SIGTERM', 'SIGHUP'],
    handleWindowsCtrlBreak: true, // SIGBREAK on Windows.
    deadlineMs: 5000,
    stopAcceptingNewWork: true,
    cancelScheduledJobs: true,
    waitForActiveOperations: true,
    flushPendingDatabaseWrites: true,
    closeDatabase: true,
    disconnectDiscord: true,
    flushLogs: true,
    idempotent: true,
    // Use Ctrl+C and wait for completion before closing the Windows terminal.
    // Windows console close provides only a brief SIGHUP cleanup window.
    // Force-kill and power loss cannot guarantee cleanup. Persist important
    // changes as they happen, not only on exit. https://nodejs.org/api/process.html
  },

  // =========================
  // GENERIC BOT MESSAGES
  // =========================
  messages: {
    noPermission: 'You do not have permission to use this command.',
    cooldownActive: 'Please wait {time} before using this command again.',
    errorOccurred: 'Something went wrong. Please try again or contact a moderator.',
    missingPermissions: 'I am missing a required Discord permission or role position.',
    commandDisabled: 'This feature is disabled in LOUD SOCIETY.',
    maintenanceMode: 'LOUD SOCIETY Bot is currently in maintenance mode.',
    managementOnly: 'Only the bot owner or configured head staff can change this.',
    featureNotReady: 'This feature needs setup. Head staff can check the startup log for the missing setting.',
    shuttingDown: 'The bot is restarting. Please try again shortly.',
    unsafeRole: 'That role cannot be self-assigned. A server administrator must review its permissions.',
    growQuestions: 'Please post regular grow questions in the grow channels, rather than opening a ticket.',
    verificationComplete: 'Welcome, Sprout! Choose your growing setup and interests below.',
    noVotes: 'Voting ended with no votes.',
    tie: 'Voting ended in a tie.',
  },

  // =========================
  // FEATURE TOGGLES
  // =========================
  // Handlers must consult these switches. Unknown features/categories fail closed.
  features: {
    moderation: true,
    logging: true,
    welcome: true,
    leveling: process.env.ENABLE_LEVELING === 'true', // OFF by default.
    tickets: true,
    battles: true,
    growerMonth: true,
    onboarding: true,
    verification: true, // Part of onboarding, not a second module.
    selfRoles: true, // Part of onboarding, not reaction-role panels.
    giveaways: true,
    counter: process.env.ENABLE_COUNTERS === 'true', // OFF by default.
    grow: true,
    community: true, // Only the allowed Loud Society commands.
    admin: true,
    health: true,

    // Explicitly disable the unwanted original modules and future placeholders.
    applications: false,
    economy: false,
    shop: false,
    currency: false,
    gambling: false,
    birthday: false,
    music: false,
    joinToCreate: false,
    reactionRoles: false,
    voice: false,
    search: false,
    tools: false,
    utility: false,
    fun: false,
    trivia: false,
    dailyBud: false,
    channelRouting: false,
    helpCenter: false,
    analytics: false,
    aiChatbot: false,
    imageGeneration: false,
    marketplace: false,
  },
};

// =========================
// CONFIGURATION VALIDATION
// =========================
// Static validation only. Fetch and validate actual roles, channel permissions,
// hierarchy, artwork, and database state in the runtime before using them.
export function validateConfig(config) {
  const errors = [];

  if (!Object.hasOwn(STATUS_LABELS, config.presence?.status ?? '')) {
    errors.push('BOT_STATUS must be online, idle, dnd, or invisible.');
  }
  if (!config.commands?.owners?.length && !config.permissions?.adminRoles?.length) {
    errors.push('Set OWNER_IDS or ADMIN_ROLE_IDS for protected bot management.');
  }
  if (config.database?.backup?.enabled) {
    if (!config.database.backup.directory?.trim()) {
      errors.push('A backup directory is required when database backups are enabled.');
    }
    if (!Number.isInteger(config.database.backup.keepLast) || config.database.backup.keepLast < 1) {
      errors.push('Keep at least one verified database backup.');
    }
    if (!Number.isFinite(config.database.backup.intervalMs) || config.database.backup.intervalMs < 60000) {
      errors.push('Backup interval must be at least 60000 milliseconds.');
    }
  }

  if (!(process.env.DISCORD_TOKEN?.trim() || process.env.TOKEN?.trim())) {
    errors.push('Bot token is required (DISCORD_TOKEN or TOKEN environment variable).');
  }
  if (!process.env.CLIENT_ID?.trim()) {
    errors.push('Client ID is required (CLIENT_ID environment variable).');
  } else if (!/^\d{17,20}$/.test(process.env.CLIENT_ID.trim())) {
    errors.push('CLIENT_ID must be a Discord ID.');
  }
  if (!config.commands?.guildId) {
    errors.push('GUILD_ID is required for the LOUD SOCIETY server.');
  }
  if (config.database?.driver !== 'sqlite' || !config.database?.filename?.trim()) {
    errors.push('A SQLite database filename is required.');
  }
  if (config.permissions?.requestAdministrator !== false) {
    errors.push('The bot must not request Administrator permission.');
  }
  if (config.permissions?.botPermissions?.includes('Administrator')) {
    errors.push('Remove Administrator from botPermissions.');
  }

  const roleOptions = [
    ...(config.onboarding?.questionOne?.options || []),
    ...(config.onboarding?.questionTwo?.options || []),
  ];
  const assignedRoles = [
    config.onboarding?.sproutRole,
    ...roleOptions.map((entry) => entry.roleId),
    ...(config.leveling?.rewards || []).map((entry) => entry.roleId),
    config.growerMonth?.winnerRole,
  ].filter(Boolean);
  const staffRoles = new Set([
    ...(config.permissions?.adminRoles || []),
    ...(config.permissions?.moderatorRoles || []),
    ...(config.tickets?.supportRoles || []),
  ]);
  // @everyone's role ID equals the guild ID. Never accept it as staff.
  if (config.commands?.guildId && staffRoles.has(config.commands.guildId)) {
    errors.push('The @everyone role must not appear in any staff role list.');
  }
  if (assignedRoles.some((id) => staffRoles.has(id))) {
    errors.push('Automatically assigned roles must not overlap with staff roles.');
  }
  // Distinct roles prevent one selection/reward from removing another role.
  if (new Set(assignedRoles).size !== assignedRoles.length) {
    errors.push('Use distinct role IDs for Sprout, each self role, XP rewards, and the monthly winner.');
  }

  // Validate configured IDs without logging their values or any secrets.
  const ids = [
    ['GUILD_ID', config.commands?.guildId],
    ['TEST_GUILD_ID', config.commands?.testGuildId],
    ...((config.commands?.owners || []).map((id) => ['OWNER_IDS', id])),
    ...([...staffRoles].map((id) => ['Staff role', id])),
    ...(assignedRoles.map((id) => ['Community role', id])),
    ['Welcome channel', config.welcome?.defaultWelcomeChannel],
    ['Moderation log channel', config.moderation?.logChannel],
    ['Support channel', config.tickets?.panelChannel],
    ['Ticket category', config.tickets?.defaultCategory],
    ['Ticket archive category', config.tickets?.archiveCategory],
    ['Ticket log channel', config.tickets?.logChannel],
    ['Onboarding channel', config.onboarding?.panelChannel],
    ['Rules channel', config.onboarding?.rulesChannel],
    ['Grower voting channel', config.growerMonth?.votingChannel],
    ['Grower announcement channel', config.growerMonth?.announcementChannel],
    ['Sprout counter channel', config.counters?.sprouts?.channelId],
    ['Boost counter channel', config.counters?.boosts?.channelId],
    ...((config.leveling?.excludedChannels || []).map((id) => ['XP excluded channel', id])),
  ];
  for (const [label, id] of ids) {
    if (id !== null && id !== undefined && !/^\d{17,20}$/.test(String(id))) {
      errors.push(`${label} must be a Discord ID.`);
    }
  }
  if (config.welcome?.test?.enabled && !config.commands?.owners?.length) {
    errors.push('Set OWNER_IDS before enabling development welcome previews.');
  }
  try {
    new Intl.DateTimeFormat('en', { timeZone: config.growerMonth?.calendarTimezone });
  } catch {
    errors.push('BOT_TIMEZONE must be a valid IANA timezone, such as UTC or America/Denver.');
  }

  return [...new Set(errors)];
}

const configErrors = validateConfig(botConfig);
if (configErrors.length > 0) {
  // Only field/error descriptions are logged. Never print tokens or process.env.
  logger.error('Bot configuration errors:', configErrors.join('\n'));
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

export const BotConfig = botConfig;

const COMMAND_CATEGORY_FEATURE_MAP = {
  admin: 'admin',
  applications: 'applications',
  battle: 'battles',
  battles: 'battles',
  birthday: 'birthday',
  community: 'community',
  economy: 'economy',
  fun: 'fun',
  giveaway: 'giveaways',
  giveaways: 'giveaways',
  grow: 'grow',
  health: 'health',
  grower: 'growerMonth',
  grower_month: 'growerMonth',
  growermonth: 'growerMonth',
  jointocreate: 'joinToCreate',
  leveling: 'leveling',
  logging: 'logging',
  moderation: 'moderation',
  music: 'music',
  onboarding: 'onboarding',
  reaction_roles: 'reactionRoles',
  search: 'search',
  self_roles: 'selfRoles',
  serverstats: 'counter',
  counters: 'counter',
  ticket: 'tickets',
  tickets: 'tickets',
  tools: 'tools',
  utility: 'utility',
  verification: 'verification',
  welcome: 'welcome',
};

function normalizeCategoryKey(category) {
  return String(category || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
}

export function getCommandPrefix() {
  return botConfig.commands?.prefix ?? '!';
}

export function getBotOwners() {
  return (botConfig.commands?.owners ?? []).map((id) => String(id).trim()).filter(Boolean);
}

export function isBotOwner(userId) {
  return Boolean(userId) && getBotOwners().includes(String(userId));
}

// Only returns a Discord presence payload; it does not start timers or log in.
// Runtime: set the selected status, then call client.user.setPresence(getBotPresence()).
export function getBotPresence(status = botConfig.presence.status) {
  if (!Object.hasOwn(STATUS_LABELS, status)) {
    throw new RangeError('Bot status must be online, idle, dnd, or invisible.');
  }
  return {
    status,
    activities: [{ name: 'Custom Status', state: STATUS_LABELS[status], type: 4 }],
  };
}

// Use a freshly fetched discord.js GuildMember. API interaction member objects
// must first be resolved through guild.members.fetch; client-supplied role IDs
// and component payloads must never be used to construct this authorization data.
export function canManageBot(member) {
  if (!member?.user || member.user.bot || member.partial) return false;
  if (!botConfig.commands.guildId || member.guild?.id !== botConfig.commands.guildId) return false;
  if (isBotOwner(member.user.id)) return true;
  const roles = member.roles?.cache;
  if (typeof roles?.has !== 'function') return false;
  return botConfig.permissions.adminRoles.some((id) => (
    id !== botConfig.commands.guildId && roles.has(id)
  ));
}

export function isMaintenanceMode() {
  return botConfig.commands?.maintenanceMode === true;
}

export function getBotMessage(key, replacements = {}) {
  let message = botConfig.messages?.[key] || String(key);
  for (const [placeholder, value] of Object.entries(replacements)) {
    // Literal replacement: keys are not interpreted as regular expressions.
    message = message.split(`{${placeholder}}`).join(String(value));
  }
  return message;
}

export function isFeatureEnabled(featureKey) {
  if (!featureKey) return true; // Retain the original helper's core-command behavior.
  return Object.hasOwn(botConfig.features, featureKey) && botConfig.features[featureKey] === true;
}

export function isCommandCategoryEnabled(category) {
  const normalized = normalizeCategoryKey(category);
  if (!normalized || normalized === 'core') return true;
  if (!Object.hasOwn(COMMAND_CATEGORY_FEATURE_MAP, normalized)) return false;
  const featureKey = COMMAND_CATEGORY_FEATURE_MAP[normalized];
  if (featureKey === 'verification' || featureKey === 'selfRoles') {
    return isFeatureEnabled('onboarding') && isFeatureEnabled(featureKey);
  }
  return isFeatureEnabled(featureKey);
}

// Retained so existing imports from the first paste do not break.
// Applications are disabled and have no default questions.
export function getApplicationStatusColor(status) {
  return getColor(status === 'approved' ? 'success' : status === 'denied' ? 'error' : 'warning');
}

export function getDefaultApplicationQuestions() {
  return [];
}

export function getColor(path, fallback = '#99AAB5') {
  const toColor = (value) => {
    if (Number.isInteger(value) && value >= 0 && value <= 0xFFFFFF) return value;
    if (typeof value === 'string' && /^#[\da-f]{6}$/i.test(value)) {
      return Number.parseInt(value.slice(1), 16);
    }
    return null;
  };
  const direct = toColor(path);
  if (direct !== null) return direct;
  const resolved = typeof path === 'string'
    ? path.split('.').reduce((obj, key) => (
      obj && Object.hasOwn(obj, key) ? obj[key] : undefined
    ), botConfig.embeds.colors)
    : undefined;
  return toColor(resolved) ?? toColor(fallback) ?? 0x99AAB5;
}

export function getRandomColor() {
  const collect = (value) => typeof value === 'string'
    ? (/^#[\da-f]{6}$/i.test(value) ? [value] : [])
    : value && typeof value === 'object' ? Object.values(value).flatMap(collect) : [];
  const colors = collect(botConfig.embeds.colors);
  return colors.length ? colors[Math.floor(Math.random() * colors.length)] : '#99AAB5';
}

export default botConfig;
