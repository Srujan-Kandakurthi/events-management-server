import { AdminRole } from '../../admins/enums/admin.enums';

export interface JwtPayload {
  sub: string;
  email: string;
  role: AdminRole;
}
