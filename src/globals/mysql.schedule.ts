import { Injectable, Logger } from '@nestjs/common';
// import { NestSchedule, Timeout } from 'nest-schedule';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { SecProfile } from '../security/profile/entities/profile.entity';
import { SecUserProfile } from '../security/user_profile/entities/user_profile.entity';
import { SecUser } from '../security/user/entities/user.entity';
import { CreateUserDto } from '../security/user/dto/create-user.dto';
import { Console } from 'console';
import { hash } from 'bcryptjs';
import { Cron, Timeout } from '@nestjs/schedule';
import { CatWayPay } from '../catalogs/waypay/entities/waypay.entity';
import { CreateWaypayDto } from '../catalogs/waypay/dto/create-waypay.dto';


@Injectable()
export class MySQLInsertTablesService {
    private readonly logger = new Logger('MySQL - Schedule');
    constructor(

        private config: ConfigService,
        private ds: DataSource
    ) { }

    @Timeout(5000)
    handleTimeout() {
        this.handleCreateProfile()
    }


    async handleCreateProfile() {
        try {

            const repo = this.ds.getRepository<SecProfile>(SecProfile)
            const data = await repo.find();

            if (data.length == 0 || this.config.get('DATABASE_SYNC') == '2') {
                const PROFILES: SecProfile[] = [{ profileId: 1, profileName: 'ADMIN-PROFILE' }, { profileId: 2, profileName: 'USER-PROFILE' }, { profileId: 3, profileName: 'GUARD-PROFILE' }]
                repo.save(PROFILES);
                this.logger.log('Generación de data correcta [SecProfile]');
            }
        } catch (err) {
            this.logger.error(`[SecProfile] - ${err}` || 'Error al generar los datos [SecProfile]');
        }

        this.handleCreateUser();
    }

    async handleCreateUser() {
        try {

            const repo = this.ds.getRepository<SecUser>(SecUser);
            const repoProfile = this.ds.getRepository<SecUserProfile>(SecUserProfile);

            const data = await repo.find();
            if (data.length == 0 || this.config.get('DATABASE_SYNC') == '2') {

                //AdminUser
                const adminDto: CreateUserDto = {
                    //userId: 1,
                    username: 'admin',
                    password: 'AdminPass.', //Initial Temporary password
                    firstName: 'Administrador',
                    lastName: 'Administrador',
                    email: 'admin@yoursite.com',
                };
                //NormalUser
                const userDto: CreateUserDto = {
                    //userId: 2,
                    username: 'user',
                    password: 'UserPass.', //Initial Temporary password
                    firstName: 'Usuario',
                    lastName: 'Usuario',
                    email: 'user@yoursite.com',
                }
                //SecurityGuard User
                const guardDto: CreateUserDto = {
                    //userId: 3,
                    username: 'guardia',
                    password: 'GuardiaReservaPase.!', //Initial Temporary password
                    firstName: 'Guardia',
                    lastName: 'Reserva',
                    email: 'guardiaReserva@yoursite.com',
                }
                const admin = await repo.create(adminDto);
                const user = await repo.create(userDto);
                const guard = await repo.create(guardDto);
            
                const saved = await repo.save([admin, user, guard]);

                const userProfiles: SecUserProfile[] = [
                    {
                        userProfileId: 1,
                        userId: 1,
                        profileId: 1
                    }, {
                        userProfileId: 2,
                        userId: 1,
                        profileId: 2
                    }, {
                        userProfileId: 3,
                        userId: 2,
                        profileId: 2
                    },
                    {
                        userProfileId: 4,
                        userId: 3,
                        profileId: 3
                    }
                ]
                const savedUserProfiles = await repoProfile.save(userProfiles)
                this.logger.log('Generación de data correcta [SecUser]');
                this.handleCreateCatWayPay()
            }
        } catch (err) {
            this.logger.error(`[SecUser] - ${err}` || 'Error al generar los datos [SecUser]');
        }


    }

    async handleCreateCatWayPay() {
        try {
            const repo = this.ds.getRepository<CatWayPay>(CatWayPay);

            const dtos: CreateWaypayDto[] = [
                {
                    cfdiKey: '01',
                    wayPayName: 'Efectivo',
                    shortName: 'E'
                }, {
                    cfdiKey: '02',
                    wayPayName: 'Cheque nominativo',
                    shortName: 'Cheq'
                }, {
                    cfdiKey: '03',
                    wayPayName: 'Transferencia electrónica de fondos',
                    shortName: 'TEF'
                }, {
                    cfdiKey: '04',
                    wayPayName: 'Tarjeta de crédito',
                    shortName: 'TDC'
                }, {
                    cfdiKey: '05',
                    wayPayName: 'Monedero electrónico',
                    shortName: 'ME'
                }, {
                    cfdiKey: '06',
                    wayPayName: 'Dinero electrónico',
                    shortName: 'DE'
                }, {
                    cfdiKey: '28',
                    wayPayName: 'Tarjeta de débito',
                    shortName: 'TDB'
                },
                {
                    cfdiKey: '30',
                    wayPayName: 'Aplicación de anticipos',
                    shortName: 'ANT'
                },
                {
                    cfdiKey: '99',
                    wayPayName: 'Por definir',
                    shortName: 'xDEF'
                },
            ]
            const saved = repo.save(dtos)
            this.logger.log('Generación de data correcta [CatWayPay]');
        } catch (error) {
            this.logger.error(`[CatWayPay] - ${error}` || 'Error al generar los datos [CatWayPay]');
        }

    }


}