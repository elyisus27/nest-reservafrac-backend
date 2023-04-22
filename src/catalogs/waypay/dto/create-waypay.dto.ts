import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, Length } from "class-validator";

export class CreateWaypayDto {

    @IsNotEmpty()
    @ApiProperty({ description: 'Name for the way pay' })
    wayPayName: string;

    @IsNotEmpty()
    @ApiProperty({ description: 'short name the way pay' })
    shortName: string;

    @IsNotEmpty()
    @Length(2, 2)
    @ApiProperty({ description: 'CFDI KEY for the way pay' })
    cfdiKey: string;

    @IsOptional()
    @ApiPropertyOptional({ description: 'Property indicating if a registry is actived' })
    tagActive?: number;

    @IsOptional()
    @ApiPropertyOptional({ description: 'Property indicating if a registry is eliminated' })
    tagDelete?: number;

    @IsOptional()
    @ApiPropertyOptional({ description: 'Property indicating the user who created this record' })
    createdBy?: number;

}
