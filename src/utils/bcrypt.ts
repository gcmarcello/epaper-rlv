import * as bcrypt from "bcrypt";

export async function hash(string: string): Promise<string> {
  const saltOrRounds = 10;
  return await bcrypt.hash(string, saltOrRounds);
}
