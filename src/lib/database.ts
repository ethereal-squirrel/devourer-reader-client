class DatabaseService {
  private static instance: DatabaseService;
  private db: any = null;
  private Database: any = null;

  private constructor() {}

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private async loadDatabase(): Promise<void> {
    if (import.meta.env.VITE_PUBLIC_CLIENT_PLATFORM === "mobile" && !this.Database) {
      this.Database = (await import("@tauri-apps/plugin-sql")).default;
    }
  }

  public async connect(): Promise<void> {
    if (import.meta.env.VITE_PUBLIC_CLIENT_PLATFORM !== "mobile") {
      return;
    }

    await this.loadDatabase();
    
    if (!this.db && this.Database) {
      this.db = await this.Database.load("sqlite:devourer.db");
    }
  }

  public async execute(query: string, params: any[] = []): Promise<any> {
    if (import.meta.env.VITE_PUBLIC_CLIENT_PLATFORM !== "mobile") {
      return null;
    }

    if (!this.db) {
      await this.connect();
    }

    return this.db!.execute(query, params);
  }

  public async select<T = any>(query: string, params: any[] = []): Promise<T> {
    if (import.meta.env.VITE_PUBLIC_CLIENT_PLATFORM !== "mobile") {
      return null as T;
    }

    if (!this.db) {
      await this.connect();
    }

    return this.db!.select(query, params);
  }

  public async close(): Promise<void> {
    if (import.meta.env.VITE_PUBLIC_CLIENT_PLATFORM !== "mobile") {
      return;
    }

    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }
}

export const db = DatabaseService.getInstance();
