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
exports.NoteController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const note_service_1 = require("./note.service");
const create_note_dto_1 = require("./dto/create-note.dto");
const update_note_dto_1 = require("./dto/update-note.dto");
const set_password_dto_1 = require("./dto/set-password.dto");
const verify_password_dto_1 = require("./dto/verify-password.dto");
const change_password_dto_1 = require("./dto/change-password.dto");
const remove_password_dto_1 = require("./dto/remove-password.dto");
let NoteController = class NoteController {
    notes;
    constructor(notes) {
        this.notes = notes;
    }
    async getContentById(id, dto) {
        const note = await this.notes.findByIdWithContent(id);
        if (!note) {
            throw new common_1.HttpException('Note not found', common_1.HttpStatus.NOT_FOUND);
        }
        if (note.password_hash) {
            if (!dto.password) {
                throw new common_1.HttpException('Password required for this note', common_1.HttpStatus.UNAUTHORIZED);
            }
            const isValid = await this.notes.verifyPassword(id, dto.password);
            if (!isValid) {
                throw new common_1.HttpException('Invalid password', common_1.HttpStatus.UNAUTHORIZED);
            }
        }
        return {
            id: note.id,
            user_id: note.user_id,
            title: note.title,
            json: note.json,
            created_at: note.created_at,
        };
    }
    async getById(id) {
        const note = await this.notes.findById(id);
        if (!note) {
            throw new common_1.HttpException('Note not found', common_1.HttpStatus.NOT_FOUND);
        }
        return {
            id: note.id,
            user_id: note.user_id,
            title: note.title,
            hasPassword: !!note.password_hash,
            created_at: note.created_at,
        };
    }
    async getByUserId(userId, req) {
        const q = req.query?.q?.trim();
        const rows = await this.notes.findByUserId(userId);
        const notes = rows.map(note => ({
            id: note.id,
            user_id: note.user_id,
            title: note.title,
            hasPassword: !!note.password_hash,
            created_at: note.created_at,
        }));
        if (!q)
            return notes;
        const lower = q.toLowerCase();
        return notes.filter((n) => (n.title ?? '').toLowerCase().includes(lower));
    }
    async create(req, dto) {
        const userId = req.user.sub;
        const note = await this.notes.createNote(userId, dto.json, dto.title, dto.password);
        return {
            id: note.id,
            user_id: note.user_id,
            title: note.title,
            hasPassword: !!note.password_hash,
            created_at: note.created_at,
        };
    }
    async update(id, req, dto) {
        const userId = req.user.sub;
        const note = await this.notes.updateNoteById(id, userId, dto.json, dto.title);
        if (!note) {
            throw new common_1.HttpException('Note not found', common_1.HttpStatus.NOT_FOUND);
        }
        return {
            id: note.id,
            user_id: note.user_id,
            title: note.title,
            hasPassword: !!note.password_hash,
            created_at: note.created_at,
        };
    }
    async delete(id, req) {
        const userId = req.user.sub;
        const ok = await this.notes.deleteNoteById(id, userId);
        return { success: ok };
    }
    async verifyPassword(id, dto) {
        if (!dto.password) {
            throw new common_1.HttpException('Password is required', common_1.HttpStatus.BAD_REQUEST);
        }
        const isValid = await this.notes.verifyPassword(id, dto.password);
        if (!isValid) {
            throw new common_1.HttpException('Invalid password', common_1.HttpStatus.UNAUTHORIZED);
        }
        return { success: true };
    }
    async setPassword(id, req, dto) {
        const userId = req.user.sub;
        const success = await this.notes.setPassword(id, userId, dto.password);
        if (!success) {
            throw new common_1.HttpException('Note not found', common_1.HttpStatus.NOT_FOUND);
        }
        return { success: true };
    }
    async changePassword(id, req, dto) {
        const userId = req.user.sub;
        const success = await this.notes.changePassword(id, userId, dto.oldPassword, dto.newPassword);
        if (!success) {
            throw new common_1.HttpException('Invalid old password or note not found', common_1.HttpStatus.BAD_REQUEST);
        }
        return { success: true };
    }
    async removePassword(id, req, dto) {
        const userId = req.user.sub;
        const isValid = await this.notes.verifyPassword(id, dto.password);
        if (!isValid) {
            throw new common_1.HttpException('Invalid password', common_1.HttpStatus.UNAUTHORIZED);
        }
        const success = await this.notes.removePassword(id, userId);
        if (!success) {
            throw new common_1.HttpException('Note not found', common_1.HttpStatus.NOT_FOUND);
        }
        return { success: true };
    }
};
exports.NoteController = NoteController;
__decorate([
    (0, common_1.Post)(':id/content'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, verify_password_dto_1.VerifyPasswordDto]),
    __metadata("design:returntype", Promise)
], NoteController.prototype, "getContentById", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NoteController.prototype, "getById", null);
__decorate([
    (0, common_1.Get)('user/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], NoteController.prototype, "getByUserId", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_note_dto_1.CreateNoteDto]),
    __metadata("design:returntype", Promise)
], NoteController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, update_note_dto_1.UpdateNoteDto]),
    __metadata("design:returntype", Promise)
], NoteController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], NoteController.prototype, "delete", null);
__decorate([
    (0, common_1.Post)(':id/verify-password'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, verify_password_dto_1.VerifyPasswordDto]),
    __metadata("design:returntype", Promise)
], NoteController.prototype, "verifyPassword", null);
__decorate([
    (0, common_1.Post)(':id/set-password'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, set_password_dto_1.SetPasswordDto]),
    __metadata("design:returntype", Promise)
], NoteController.prototype, "setPassword", null);
__decorate([
    (0, common_1.Post)(':id/change-password'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, change_password_dto_1.ChangePasswordDto]),
    __metadata("design:returntype", Promise)
], NoteController.prototype, "changePassword", null);
__decorate([
    (0, common_1.Delete)(':id/password'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, remove_password_dto_1.RemovePasswordDto]),
    __metadata("design:returntype", Promise)
], NoteController.prototype, "removePassword", null);
exports.NoteController = NoteController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('note'),
    __metadata("design:paramtypes", [note_service_1.NoteService])
], NoteController);
//# sourceMappingURL=note.controller.js.map