export interface Article {
    postId: number;
    revisionId: number;
    uuid: string | null;
}

export interface World {
    lastSavedArticle: Article | null;
}

const add = (a: number, b: number): number => {
    return a + b;
};

const oldVar: string = "Hello, world!";
