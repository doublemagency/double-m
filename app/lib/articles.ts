export const articles = [
  {
    slug: "choose-the-right-caregiver",
    title: "How to choose the right caregiver",
    excerpt:
      "A practical way to assess care needs, experience, communication and household fit before making a decision.",
    date: "2026-07-21",
    read: "5 min",
    cover: "/images/care-story.webp",
    sections: [
      [
        "Start with the person receiving care",
        "Write down the support needed during a normal day: mobility, meals, medication reminders, companionship, appointments and personal routines. Separate essential care needs from preferences so interviews stay focused.",
      ],
      [
        "Ask for examples, not promises",
        "Invite candidates to explain how they handled a difficult moment, communicated a change or protected an older person’s dignity. Specific examples reveal judgement better than yes-or-no answers.",
      ],
      [
        "Agree on the working relationship",
        "Clarify duties, hours, rest days, communication, household boundaries and who makes care decisions. A clear role protects the caregiver, the family and the person receiving support.",
      ],
      [
        "Use a careful placement process",
        "Identity, experience and reference checks should match the role. Double M combines screening information with human interviews; a match score may assist but never makes the final decision.",
      ],
    ],
  },
  {
    slug: "interview-questions-for-househelps",
    title: "Interview questions for househelps",
    excerpt:
      "Questions that help employers discuss experience, routines, expectations and respectful working arrangements.",
    date: "2026-07-21",
    read: "4 min",
    cover: "/images/recruitment-hero.webp",
    sections: [
      [
        "Discuss a normal working day",
        "Ask the candidate to describe how they plan cleaning, laundry, meals or childcare when several tasks compete for attention.",
      ],
      [
        "Explore judgement and communication",
        "Useful questions include: What would you do if an appliance broke? How would you raise a concern? When would you contact the employer immediately?",
      ],
      [
        "Be equally clear as an employer",
        "Explain the actual workload, household size, schedule, rest arrangements, accommodation where relevant and what success looks like. Interviews work best when both sides can make an informed decision.",
      ],
    ],
  },
  {
    slug: "caring-for-elderly-parents",
    title: "Planning support for elderly parents",
    excerpt:
      "A calm framework for identifying support needs while preserving choice, routine and dignity.",
    date: "2026-07-21",
    read: "5 min",
    cover: "/images/care-story.webp",
    sections: [
      [
        "Plan with, not only for, your parent",
        "Where possible, include the older person in conversations about routines, privacy, food, companionship and the qualities they value in a caregiver.",
      ],
      [
        "Map practical needs",
        "Consider mobility, meals, appointments, household tasks, social connection and emergencies. Clinical or medication needs should be discussed with qualified health professionals.",
      ],
      [
        "Create a communication rhythm",
        "Agree on what the caregiver records, when family members receive updates and which changes require immediate escalation. Clear communication reduces anxiety for everyone.",
      ],
    ],
  },
  {
    slug: "child-safety-at-home",
    title: "A practical child-safety conversation at home",
    excerpt:
      "What parents and nannies should agree before care begins, from routines and visitors to emergencies and digital boundaries.",
    date: "2026-07-21",
    read: "4 min",
    cover: "/images/care-story.webp",
    sections: [
      [
        "Share the child’s real routine",
        "Explain meals, allergies, sleep, school, play, comfort, behaviour guidance and who is authorised to collect or visit the child.",
      ],
      [
        "Walk through the home together",
        "Identify medicines, cleaning products, water areas, balconies, gates, cooking risks and emergency exits. Provide working contacts and explain when to call for help.",
      ],
      [
        "Agree on communication and privacy",
        "Set expectations for photographs, social media, devices, outings and updates. A nanny should never need to guess the household’s safety rules.",
      ],
    ],
  },
  {
    slug: "respectful-domestic-employment-kenya",
    title: "Building a respectful domestic working relationship",
    excerpt:
      "Clear duties, fair communication, privacy and documented expectations create safer, more dependable placements.",
    date: "2026-07-21",
    read: "6 min",
    cover: "/images/recruitment-hero.webp",
    sections: [
      [
        "Put expectations in writing",
        "Record duties, schedule, pay, rest, leave, accommodation where applicable and how either side raises a concern. Use language everyone understands.",
      ],
      [
        "Respect applies in both directions",
        "Workers deserve dignity, privacy, a safe environment and clear communication. Employers deserve honesty, professional conduct and respect for the home’s privacy.",
      ],
      [
        "Handle concerns early",
        "Small misunderstandings become bigger when nobody speaks. Use calm, specific conversations and record agreed changes. Serious safety, harassment or contractual concerns should be escalated through the agency and appropriate official channels.",
      ],
      [
        "Keep guidance current",
        "Employment circumstances differ. For formal rights, statutory obligations or disputes, use current guidance from Kenya’s labour authorities or a qualified professional rather than relying on a general article.",
      ],
    ],
  },
  {
    slug: "prepare-for-agency-verification",
    title: "How to prepare for agency verification",
    excerpt:
      "A simple checklist for job seekers: documents, references, honest work history and what to expect from the verification call.",
    date: "2026-07-21",
    read: "5 min",
    cover: "/images/recruitment-hero.webp",
    sections: [
      [
        "Gather clear, current documents",
        "Prepare a readable ID copy, a recent passport photo, your CV and role-relevant certificates. Upload only through your private account or present them to authorised agency staff.",
      ],
      [
        "Make your work history easy to confirm",
        "Use accurate dates, role names and responsibilities. Ask referees for permission before sharing their contact details and let them know the agency may call.",
      ],
      [
        "Be direct during the verification call",
        "Explain what you do well, the roles you want, your availability, preferred location and realistic salary expectations. Honest information produces stronger matches than exaggerated claims.",
      ],
      [
        "Know what professional verification looks like",
        "Double M reviews information for recruitment purposes, restricts identity documents to authorised staff and does not expose raw IDs or certificates to employers. Verification supports human decisions; it does not promise placement.",
      ],
    ],
  },
] as const;
export function article(slug: string) {
  return articles.find((x) => x.slug === slug);
}
