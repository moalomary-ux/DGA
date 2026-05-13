// MOCK DB — Frontend design only
import * as MOCK from './mock-data';

function mockTag(strings: TemplateStringsArray, ...values: any[]): any {
  const sql = strings.join('').toLowerCase();
  
  if (sql.includes('insert into')) return Promise.resolve([{ id: Math.floor(Math.random() * 10000) }]);
  if (sql.includes('information_schema.columns')) return Promise.resolve([]);
  if (sql.includes('count(')) return Promise.resolve([{ count: 0, c: 0, total: 0 }]);
  
  if (sql.includes('from qtech_orgs')) return Promise.resolve(MOCK.MOCK_ORGS);
  if (sql.includes('from qtech_liaisons')) return Promise.resolve(MOCK.MOCK_LIAISONS);
  if (sql.includes('from qtech_programs')) return Promise.resolve(MOCK.MOCK_PROGRAMS);
  if (sql.includes('from qtech_beneficiaries')) return Promise.resolve(MOCK.MOCK_BENEFICIARIES);
  if (sql.includes('from qtech_inbound')) return Promise.resolve(MOCK.MOCK_INBOX);
  if (sql.includes('from users')) return Promise.resolve(MOCK.MOCK_USERS);
  
  return Promise.resolve([]);
}

(mockTag as any).unsafe = (_sql: string, _vals?: any[]): any => Promise.resolve([]);
(mockTag as any).begin = async (fn: any) => fn(mockTag);
(mockTag as any).end = async () => {};

export const db: any = mockTag;
export default db;
