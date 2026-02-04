import { IsString, IsEmail, IsOptional, Length, Matches, IsNotEmpty } from 'class-validator';

export class CreateSchoolDto {
    @IsString()
    @IsNotEmpty()
    @Length(1, 200)
    name: string;

    @IsString()
    @IsNotEmpty()
    @Length(1, 200)
    district: string;

    @IsString()
    @IsNotEmpty()
    @Length(1, 100)
    contactName: string;

    @IsEmail()
    @Length(1, 255)
    contactEmail: string;

    @IsOptional()
    @IsString()
    @Length(1, 20)
    @Matches(/^[\d\s\-\+\(\)]+$/, {
        message: 'contactPhone must contain only digits, spaces, dashes, plus signs, or parentheses',
    })
    contactPhone?: string;

    @IsString()
    @IsNotEmpty()
    @Length(2, 10)
    @Matches(/^[A-Z0-9]+$/, {
        message: 'shortCode must contain only uppercase letters and numbers',
    })
    shortCode: string;
}
