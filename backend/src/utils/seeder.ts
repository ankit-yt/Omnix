import { Plan } from '@/models/base/index.js';
import { IPlan } from '@/models/base/types.js';

export const seedSystemPlans = async():Promise<void>=>{
  try{
    const freePlanExists = await Plan.findOne({code:'free'}).lean();

    if(!freePlanExists){
      console.log('[SEEDER] "free" plan code not found. Injecting default billing tiers...');

      const defaultPlans:Partial<IPlan>[]= [
        {
          code:'free',
          displayName:'Free Tier',
          description:'Perfect for prototyping and getting started with document analysis.',
          priceInPaise:0,
          currency:'INR',
          sortOrder:1,
          limits:{
            messagesPerMonth:100,
            knowledgeBaseSizeMB:10,
            teamMembers:1,
            maxWorkspaces:1
          },
          features:[
            '10 MB Knowledge Base Storage',
            '100 Message per month',
            'Access to Gemini 1.5 Flash',
            '1 Default workspace'
          ]
        },
        {
          code:'pro',
          displayName:'Pro Specialist',
          description:'Unlocks deeper limits, scalable workflows, and larger contextual vectors.',
          priceInPaise:29900,
          currency:'INR',
          sortOrder:2,
          limits:{
            messagesPerMonth:1000,
            knowledgeBaseSizeMB:200,
            teamMembers:5,
            maxWorkspaces:4
          },
          features:[
            '200 MB Knowledge Base Storage',
            '1000 Message per month',
            'Prioritized Lightning Fast Generation',
            'Up to 4 workspaces',
            'Callaborate with up to 5 team members'
          ]
        }
      ];

      await Plan.insertMany(defaultPlans);
      console.log('[SEEDER] All core system subscription plans seeded successfully.');
    }else{
      console.log('[SEEDER] Default pricing tiers already present. Skipping initialization.');
    }
  }catch (error) {
    console.error('[SEEDER_CRITICAL_FAIL] Error while verifying or seeding database tiers:', error);
  }
}