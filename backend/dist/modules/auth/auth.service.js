"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const user_service_1 = require("../user/user.service");
let AuthService = class AuthService {
    jwt;
    config;
    users;
    constructor(jwt, config, users) {
        this.jwt = jwt;
        this.config = config;
        this.users = users;
    }
    async signTokens(userId, email) {
        const accessPayload = { sub: userId, email };
        const refreshPayload = { sub: userId, email };
        const accessToken = await this.jwt.signAsync(accessPayload, {
            secret: this.config.get('JWT_ACCESS_SECRET') ||
                this.config.get('JWT_SECRET') ||
                'dev_access_secret',
            expiresIn: this.config.get('JWT_ACCESS_TTL') ?? '15m',
        });
        const refreshToken = await this.jwt.signAsync(refreshPayload, {
            secret: this.config.get('JWT_REFRESH_SECRET') ||
                this.config.get('JWT_SECRET') ||
                'dev_refresh_secret',
            expiresIn: this.config.get('JWT_REFRESH_TTL') ?? '7d',
        });
        return { accessToken, refreshToken };
    }
    async me(id) {
        const user = await this.users.findById(id);
        return user;
    }
    async signup(email, password) {
        const existing = await this.users.findByEmail(email);
        if (existing) {
            throw new common_1.UnauthorizedException('Email already in use');
        }
        const created = await this.users.createUser(email, password);
        const tokens = await this.signTokens(created.id, created.email);
        await this.users.updateRefreshToken(created.id, tokens.refreshToken);
        return tokens;
    }
    async login(email, password) {
        const user = await this.users.validateUserCredentials(email, password);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const tokens = await this.signTokens(user.id, user.email);
        await this.users.updateRefreshToken(user.id, tokens.refreshToken);
        return tokens;
    }
    async logout(userId) {
        await this.users.updateRefreshToken(userId, null);
        return { success: true };
    }
    async refresh(userId, refreshToken, email) {
        const valid = await this.users.isRefreshTokenValid(userId, refreshToken);
        if (!valid) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        const tokens = await this.signTokens(userId, email);
        await this.users.updateRefreshToken(userId, tokens.refreshToken);
        return tokens;
    }
    async loginWithGoogle(profile) {
        if (!profile.email) {
            throw new common_1.UnauthorizedException('Google account has no email');
        }
        let user = await this.users.findByEmail(profile.email);
        if (!user) {
            const placeholderPassword = `${profile.googleId}.${Date.now()}`;
            const created = await this.users.createUser(profile.email, placeholderPassword);
            user = {
                id: created.id,
                email: created.email,
                password_hash: '',
                refresh_token_hash: null,
            };
        }
        const tokens = await this.signTokens(user.id, profile.email);
        await this.users.updateRefreshToken(user.id, tokens.refreshToken);
        return tokens;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService,
        user_service_1.UserService])
], AuthService);
//# sourceMappingURL=auth.service.js.map