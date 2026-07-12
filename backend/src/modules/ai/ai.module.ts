import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AiConversationsController } from './controllers/ai-conversations.controller';
import { AiPromptsController } from './controllers/ai-prompts.controller';
import { AiProvidersController } from './controllers/ai-providers.controller';
import { AiSettingsController } from './controllers/ai-settings.controller';
import { AiUsageController } from './controllers/ai-usage.controller';
import { FeatureFlagsController } from './controllers/feature-flags.controller';
import { AI_PROVIDER } from './providers/ai-provider.interface';
import { NullAiProvider } from './providers/null-ai.provider';
import { AiAuditService } from './services/ai-audit.service';
import { AiProviderConfigService } from './services/ai-provider-config.service';
import { AiSettingsService } from './services/ai-settings.service';
import { ConversationService } from './services/conversation.service';
import { FeatureFlagService } from './services/feature-flag.service';
import { PromptService } from './services/prompt.service';
import { TokenUsageService } from './services/token-usage.service';

@Module({
  imports: [AuditModule],
  controllers: [
    AiSettingsController,
    FeatureFlagsController,
    AiProvidersController,
    AiUsageController,
    AiPromptsController,
    AiConversationsController,
  ],
  providers: [
    {
      provide: AI_PROVIDER,
      useClass: NullAiProvider,
    },
    NullAiProvider,
    AiAuditService,
    AiSettingsService,
    FeatureFlagService,
    AiProviderConfigService,
    PromptService,
    ConversationService,
    TokenUsageService,
  ],
  exports: [
    FeatureFlagService,
    PromptService,
    TokenUsageService,
    AiProviderConfigService,
    AI_PROVIDER,
  ],
})
export class AiModule {}
