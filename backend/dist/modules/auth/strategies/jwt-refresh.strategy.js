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
exports.JwtRefreshStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_jwt_1 = require("passport-jwt");
const config_1 = require("@nestjs/config");
let JwtRefreshStrategy = class JwtRefreshStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy, 'jwt-refresh') {
    configService;
    constructor(configService) {
        const secret = configService.get('JWT_REFRESH_SECRET') ||
            configService.get('JWT_SECRET') ||
            'dev_refresh_secret';
        super({
            jwtFromRequest: (req) => getTokenFromCookies(req, 'refreshToken'),
            ignoreExpiration: false,
            secretOrKey: secret,
            passReqToCallback: true,
        });
        this.configService = configService;
    }
    validate(req, payload) {
        const refreshToken = getTokenFromCookies(req, 'refreshToken');
        return { ...payload, refreshToken };
    }
};
exports.JwtRefreshStrategy = JwtRefreshStrategy;
exports.JwtRefreshStrategy = JwtRefreshStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], JwtRefreshStrategy);
function getTokenFromCookies(req, name) {
    const rawCookie = req.headers['cookie'];
    if (!rawCookie)
        return null;
    const parts = rawCookie.split(';');
    for (const part of parts) {
        const [k, v] = part.split('=').map((s) => s.trim());
        if (k === name)
            return decodeURIComponent(v || '');
    }
    return null;
}
//# sourceMappingURL=jwt-refresh.strategy.js.map