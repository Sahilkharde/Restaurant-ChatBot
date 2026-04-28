CREATE TABLE customerAnonymousUsers (
    customerAnonymousUsersId int IDENTITY(1,1) NOT NULL,
	customerAnonymousUsersUniqueId nvarchar(1000) NOT NULL,
    name nvarchar(64) NOT NULL,
    email nvarchar(64) NOT NULL,
    phone nvarchar(64) NOT NULL,
	countryCodeId nvarchar(50) NULL,
	countryCode varchar(30) NULL,
    createdAt datetime NULL,
    ipAddress nvarchar(250) NULL,
	CONSTRAINT [PK_customerAnonymousUsers] PRIMARY KEY CLUSTERED 
(
  [customerAnonymousUsersId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

CREATE TABLE customerAnonymousUsersChatConversations (
    customerAnonymousUsersChatConversationsId int IDENTITY(1,1) NOT NULL,
	customerAnonymousUsersChatConversationsUniqueId nvarchar(1000) NOT NULL,
    customerAnonymousUsersUniqueId nvarchar(1000) NOT NULL,
    initatedDateTime datetime NULL,
    endedDateTime datetime NULL,
    conversationTitle nvarchar(1000),
	CONSTRAINT [PK_customerAnonymousUsersChatConversations] PRIMARY KEY CLUSTERED 
(
  [customerAnonymousUsersChatConversationsId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]


CREATE TABLE customerChatConversations (
    customerChatConversationsId int IDENTITY(1,1) NOT NULL,
	customerChatConversationsUniqueId nvarchar(1000) NOT NULL,
    applicationUserId int NULL,
    initatedDateTime datetime NULL,
    endedDateTime datetime NULL,
    conversationTitle nvarchar(1000),
	CONSTRAINT [PK_customerChatConversations] PRIMARY KEY CLUSTERED 
(
  [customerChatConversationsId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

CREATE TABLE customerAnonymousUsersChatMessages (
    customerAnonymousUsersChatMessagesId int IDENTITY(1,1) NOT NULL,
    customerAnonymousUsersChatConversationsUniqueId nvarchar(1000) NOT NULL,
    role nvarchar(255) NOT NULL,
    content nvarchar(MAX) NOT NULL,
    messageDateTime datetime NULL,
    CONSTRAINT [PK_customerAnonymousUsersChatMessages] PRIMARY KEY CLUSTERED 
(
  [customerAnonymousUsersChatMessagesId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

CREATE TABLE customerChatMessages (
    customerChatMessagesId int IDENTITY(1,1) NOT NULL,
    customerChatConversationsUniqueId nvarchar(1000) NOT NULL,
    role nvarchar(255) NOT NULL,
    content nvarchar(MAX) NOT NULL,
    messageDateTime datetime NULL,
    CONSTRAINT [PK_customerChatMessages] PRIMARY KEY CLUSTERED 
(
  [customerChatMessagesId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]


-- notary after login
CREATE TABLE notaryChatConversations (
    notaryChatConversationsId int IDENTITY(1,1) NOT NULL,
	notaryChatConversationsUniqueId nvarchar(1000) NOT NULL,
    serviceProviderId int NULL,
    initatedDateTime datetime NULL,
    updatedDateTime datetime NULL,
    conversationTitle nvarchar(1000),
	CONSTRAINT [PK_notaryChatConversations] PRIMARY KEY CLUSTERED 
(
  [notaryChatConversationsId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

CREATE TABLE notaryChatMessages (
    notaryChatMessagesId int IDENTITY(1,1) NOT NULL,
    notaryChatConversationsUniqueId nvarchar(1000) NOT NULL,
    role nvarchar(255) NOT NULL,
    content nvarchar(MAX) NOT NULL,
    messageDateTime datetime NULL,
    CONSTRAINT [PK_notaryChatMessages] PRIMARY KEY CLUSTERED 
(
  [notaryChatMessagesId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

-- notary anonymous users
CREATE TABLE notaryAnonymousUsers (
    notaryAnonymousUsersId int IDENTITY(1,1) NOT NULL,
	notaryAnonymousUsersUniqueId nvarchar(1000) NOT NULL,
    name nvarchar(64) NOT NULL,
    email nvarchar(64) NOT NULL,
    phone nvarchar(64) NOT NULL,
	countryCodeId nvarchar(50) NULL,
	countryCode varchar(30) NULL,
    createdAt datetime NULL,
    ipAddress nvarchar(250) NULL,
	CONSTRAINT [PK_notaryAnonymousUsers] PRIMARY KEY CLUSTERED 
(
  [notaryAnonymousUsersId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

CREATE TABLE notaryAnonymousUsersChatConversations (
    notaryAnonymousUsersChatConversationsId int IDENTITY(1,1) NOT NULL,
	notaryAnonymousUsersChatConversationsUniqueId nvarchar(1000) NOT NULL,
    notaryAnonymousUsersUniqueId nvarchar(1000) NOT NULL,
    initatedDateTime datetime NULL,
    updatedDateTime datetime NULL,
    conversationTitle nvarchar(1000),
	CONSTRAINT [PK_notaryAnonymousUsersChatConversations] PRIMARY KEY CLUSTERED 
(
  [notaryAnonymousUsersChatConversationsId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

CREATE TABLE notaryAnonymousUsersChatMessages (
    notaryAnonymousUsersChatMessagesId int IDENTITY(1,1) NOT NULL,
    notaryAnonymousUsersChatConversationsUniqueId nvarchar(1000) NOT NULL,
    role nvarchar(255) NOT NULL,
    content nvarchar(MAX) NOT NULL,
    messageDateTime datetime NULL,
    CONSTRAINT [PK_notaryAnonymousUsersChatMessages] PRIMARY KEY CLUSTERED 
(
  [notaryAnonymousUsersChatMessagesId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]


-- business after login
CREATE TABLE businessChatConversations (
    businessChatConversationsId int IDENTITY(1,1) NOT NULL,
	businessChatConversationsUniqueId nvarchar(1000) NOT NULL,
    businessUserId int NULL,
    initatedDateTime datetime NULL,
    updatedDateTime datetime NULL,
    conversationTitle nvarchar(1000),
	CONSTRAINT [PK_businessChatConversations] PRIMARY KEY CLUSTERED 
(
  [businessChatConversationsId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

CREATE TABLE businessChatMessages (
    businessChatMessagesId int IDENTITY(1,1) NOT NULL,
    businessChatConversationsUniqueId nvarchar(1000) NOT NULL,
    role nvarchar(255) NOT NULL,
    content nvarchar(MAX) NOT NULL,
    messageDateTime datetime NULL,
    CONSTRAINT [PK_businessChatMessages] PRIMARY KEY CLUSTERED 
(
  [businessChatMessagesId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

-- business anonymous users
CREATE TABLE businessAnonymousUsers (
    businessAnonymousUsersId int IDENTITY(1,1) NOT NULL,
	businessAnonymousUsersUniqueId nvarchar(1000) NOT NULL,
    name nvarchar(64) NOT NULL,
    email nvarchar(64) NOT NULL,
    phone nvarchar(64) NOT NULL,
	countryCodeId nvarchar(50) NULL,
	countryCode varchar(30) NULL,
    createdAt datetime NULL,
    ipAddress nvarchar(250) NULL,
	CONSTRAINT [PK_businessAnonymousUsers] PRIMARY KEY CLUSTERED 
(
  [businessAnonymousUsersId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

CREATE TABLE businessAnonymousUsersChatConversations (
    businessAnonymousUsersChatConversationsId int IDENTITY(1,1) NOT NULL,
	businessAnonymousUsersChatConversationsUniqueId nvarchar(1000) NOT NULL,
    businessAnonymousUsersUniqueId nvarchar(1000) NOT NULL,
    initatedDateTime datetime NULL,
    updatedDateTime datetime NULL,
    conversationTitle nvarchar(1000),
	CONSTRAINT [PK_businessAnonymousUsersChatConversations] PRIMARY KEY CLUSTERED 
(
  [businessAnonymousUsersChatConversationsId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

CREATE TABLE businessAnonymousUsersChatMessages (
    businessAnonymousUsersChatMessagesId int IDENTITY(1,1) NOT NULL,
    businessAnonymousUsersChatConversationsUniqueId nvarchar(1000) NOT NULL,
    role nvarchar(255) NOT NULL,
    content nvarchar(MAX) NOT NULL,
    messageDateTime datetime NULL,
    CONSTRAINT [PK_businessAnonymousUsersChatMessages] PRIMARY KEY CLUSTERED 
(
  [businessAnonymousUsersChatMessagesId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

--------------------------------------------------------------------------------------------------------
#Bhuvanesh - 08/05/2025

ALTER TABLE customerAnonymousUsersChatConversations DROP column endedDateTime;

ALTER TABLE customerAnonymousUsersChatConversations ADD updatedDateTime DATETIME NULL;

ALTER TABLE customerChatConversations DROP column endedDateTime;

ALTER TABLE customerChatConversations ADD updatedDateTime DATETIME NULL;

--------------------------------------------------------------------------------------------------------
