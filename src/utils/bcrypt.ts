import * as bcrypt from "bcrypt";

export async function hash(string: string): Promise<string> {
  const saltOrRounds = 10;
  return await bcrypt.hash(string, saltOrRounds);
}

export async function compare(string: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(string, hash);
}
