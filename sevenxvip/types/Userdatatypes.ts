export interface Transaction {
  id: string;
  date: string;
  amount: number;
  status: string;
}

export interface FavoriteContent {
  id: string;
  title: string;
}

export interface Userdatatypes {
  id?: number
  name: string;
  email: string;
  isVip: boolean;
  vipExpirationDate: number;
  lastLogin: string;
  isAdmin: boolean;
  recentlyViewed: string[];
  transactions: Transaction[];
  favorites: FavoriteContent[];
  stripeSubscriptionId: string | null;
  profileImage: any,
  username: string,
  createdAt: string,
  vipTier?: 'diamond' | 'titanium',
  subscriptionType?: 'monthly' | 'annual',
  requestTickets?: number,
  requestTicketsResetDate?: string
}


 export type LinkItem = {
     id: number | string;
     name: string;
     mega: string;
     mega2?: string;
     pixeldrain?: string;
     AdmavenMega?: string;
     AdmavenMega2?: string;
     AdmavenPixeldrain?: string;
     category: string;
     postDate: string;
     createdAt: string;
     updatedAt: string;
     slug: string;
     thumbnail?: string;
    contentType?: 'asian' | 'western' | 'banned' | 'unknown' | 'vip';
   };

export type Reaction = {
  emoji: string;
  count: number;
};

export type LinkItemWithReactions = LinkItem & {
  reactions: Reaction[];
};
