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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const auth_service_1 = require("./auth.service");
const signup_dto_1 = require("./dto/signup.dto");
const login_dto_1 = require("./dto/login.dto");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
const jwt_refresh_guard_1 = require("./guards/jwt-refresh.guard");
let AuthController = class AuthController {
    auth;
    constructor(auth) {
        this.auth = auth;
    }
    me(req) {
        const userId = req.user.sub;
        return this.auth.me(userId);
    }
    async signup(dto, res) {
        const tokens = await this.auth.signup(dto.email, dto.password);
        this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
        return { success: true };
    }
    async login(dto, res) {
        const tokens = await this.auth.login(dto.email, dto.password);
        this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
        return { success: true };
    }
    logout(req, res) {
        const userId = req.user.sub;
        res.clearCookie('accessToken', this.cookieClearOptions());
        res.clearCookie('refreshToken', this.cookieClearOptions());
        return this.auth.logout(userId);
    }
    async refresh(req, res) {
        const userId = req.user.sub;
        const refreshToken = req.user.refreshToken;
        const email = req.user.email;
        const tokens = await this.auth.refresh(userId, refreshToken, email);
        this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
        return { success: true };
    }
    googleAuth() {
        return { success: true };
    }
    async googleCallback(req, res) {
        const profile = req.user;
        const tokens = await this.auth.loginWithGoogle(profile);
        this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
        const redirectUrl = process.env.OAUTH_SUCCESS_REDIRECT_URL || '/';
        if (redirectUrl) {
            res.redirect?.(redirectUrl);
            return;
        }
        return { success: true };
    }
    setAuthCookies(res, accessToken, refreshToken) {
        const isProd = process.env.NODE_ENV === 'production';
        const common = {
            httpOnly: true,
            sameSite: process.env.COOKIE_SAMESITE || 'lax',
            secure: isProd || process.env.COOKIE_SECURE === 'true',
            path: '/',
            domain: process.env.COOKIE_DOMAIN || undefined,
        };
        res.cookie('accessToken', accessToken, {
            ...common,
            maxAge: this.parseMs(process.env.JWT_ACCESS_TTL) || 15 * 60 * 1000,
        });
        res.cookie('refreshToken', refreshToken, {
            ...common,
            maxAge: this.parseMs(process.env.JWT_REFRESH_TTL) || 7 * 24 * 60 * 60 * 1000,
        });
    }
    cookieClearOptions() {
        const isProd = process.env.NODE_ENV === 'production';
        return {
            httpOnly: true,
            sameSite: process.env.COOKIE_SAMESITE || 'lax',
            secure: isProd || process.env.COOKIE_SECURE === 'true',
            path: '/',
            domain: process.env.COOKIE_DOMAIN || undefined,
        };
    }
    parseMs(ttl) {
        if (!ttl)
            return undefined;
        const match = /^([0-9]+)([smhd])?$/.exec(ttl);
        if (!match)
            return undefined;
        const n = parseInt(match[1], 10);
        const unit = match[2] || 's';
        const multipliers = {
            s: 1000,
            m: 60000,
            h: 3600000,
            d: 86400000,
        };
        return n * (multipliers[unit] || 1000);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('me'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "me", null);
__decorate([
    (0, common_1.Post)('signup'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [signup_dto_1.SignUpDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "signup", null);
__decorate([
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('logout'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.UseGuards)(jwt_refresh_guard_1.JwtRefreshGuard),
    (0, common_1.Post)('refresh'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, common_1.Get)('google'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('google')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "googleAuth", null);
__decorate([
    (0, common_1.Get)('google/callback'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('google')),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "googleCallback", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map