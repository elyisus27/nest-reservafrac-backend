import { Injectable } from '@nestjs/common';
import { CreateUserProfileDto } from './dto/create-user_profile.dto';
import { UpdateUserProfileDto } from './dto/update-user_profile.dto';

@Injectable()
export class UserProfileService {
  create(createUserProfileDto: CreateUserProfileDto) {
    return 'This action adds a new userProfile';
  }

  findAll() {
    return `This action returns all userProfile`;
  }

  findOne(id: number) {
    return `This action returns a #${id} userProfile`;
  }

  update(id: number, updateUserProfileDto: UpdateUserProfileDto) {
    return `This action updates a #${id} userProfile`;
  }

  remove(id: number) {
    return `This action removes a #${id} userProfile`;
  }
}
