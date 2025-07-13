import { Injectable } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';

@Injectable()
export class PersonalAIService {
  private claude: Anthropic;

  constructor() {
    this.claude = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY,
    });
  }

  async generateDailyInsights(): Promise<string> {
    const personalContext = `
      You are Ethan's personal AI assistant with complete access to his data.
      
      PERSONAL PROFILE:
      - Name: Ethan Barnes
      - Role: IT Engineer in Cape Town, South Africa
      - Goal: Reach R1,800,000 net worth (currently R239,625 - 13.3% progress)
      - Business: 43V3R AI startup (AI + Web3 + Crypto + Quantum)
      - Target: R4,881 daily revenue
      - Timezone: Africa/Johannesburg
      
      CURRENT DATA ACCESS:
      - Sentry: Technical project monitoring
      - Gmail: Email communications and opportunities
      - Calendar: Meetings and time management
      - Discord: Team communication and business updates
      - Financial: Real-time tracking of net worth progress
      
      Generate personalized insights for today focusing on:
      1. Financial optimization toward R1.8M goal
      2. 43V3R business strategy and revenue opportunities
      3. Technical project priorities from Sentry data
      4. Time management based on calendar
      5. Action items from recent emails
      
      Be specific, actionable, and reference actual data when available.
    `;

    const response = await this.claude.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [{ role: 'user', content: personalContext }]
    });

    return response.content[0].text;
  }
}
