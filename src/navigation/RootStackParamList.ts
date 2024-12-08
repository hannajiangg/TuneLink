// src/navigation/RootStackParamList.ts

export type RootStackParamList = {
    Splash: undefined;
    Signup: undefined;
    Onboarding: { 
        userId: string;
      };    
    Login: undefined;
    Feed: { 
        userId: string;
      };
    Profile: { 
        userId: string;
      };
    MakePost: { 
        userId: string;
      };
    SinglePostScreen: {
      postId: string;
    };
    Follow: {
      userId: string;
      currentUserId: string;
    }
    Search: {
      userId: string;
    }
    User: {
      userId: string;
    }
    EditProfile: {
      userId: string;
    }
    OtherUserProfile: {
      userId: string;
      otherUserId: string;
    }
};
