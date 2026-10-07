import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
const PASSWORD_MSG = 'Mật khẩu tối thiểu 8 ký tự, có cả chữ và số';

export class RegisterDto {
  @IsString() @MinLength(2) @MaxLength(100) name: string;
  @IsEmail({}, { message: 'Email không hợp lệ' }) email: string;
  @Matches(PASSWORD_RULE, { message: PASSWORD_MSG }) password: string;
  // Lời nhắn cho quản trị viên (bộ phận, lý do...)
  @IsOptional() @IsString() @MaxLength(500) note?: string;
}

export class LoginDto {
  @IsEmail({}, { message: 'Email không hợp lệ' }) email: string;
  @IsString() @MinLength(1) password: string;
  @IsOptional() remember?: boolean;
}

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Email không hợp lệ' }) email: string;
}

export class ResetPasswordDto {
  @IsString() token: string;
  @Matches(PASSWORD_RULE, { message: PASSWORD_MSG }) password: string;
}

export class ChangePasswordDto {
  // Bắt buộc nếu tài khoản đã có mật khẩu
  @IsOptional() @IsString() currentPassword?: string;
  @Matches(PASSWORD_RULE, { message: PASSWORD_MSG }) newPassword: string;
}

export class TotpCodeDto {
  @IsString() @Length(6, 6, { message: 'Mã gồm 6 chữ số' }) code: string;
}
