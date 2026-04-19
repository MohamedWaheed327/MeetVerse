import api, { update_api_authentication } from "./api";

export class ChangePasswordDto {
    public OldPassword: string;
    public NewPassword: string;

    constructor(OldPassword: string, NewPassword: string) {
        this.NewPassword = NewPassword;
        this.OldPassword = OldPassword;
    }
};

export class ChangeNameDto {
    public NewName: string;

    constructor(NewName: string) {
        this.NewName = NewName;
    }
}

export const ChangePassword = async (oldPassword: string, newPassword: string, ConfirmNewPassword: string) => {
    try {
        if (newPassword != ConfirmNewPassword) throw new Error("new password is not equal to confirm new password");
        let data = new ChangePasswordDto(oldPassword, newPassword);
        const response = await api.put("/profile/password", data);
        const token = response.data.token;
        localStorage.setItem("token", token);
        update_api_authentication();
        return response.data;
    } catch (error: unknown) {
        if (error instanceof Error) {
            throw Error(error.message);
        } else {
            throw Error("Network error");
        }
    }
};

export const ChangeName = async (firstName: string, lastName: string) => {
    try {
        let newName = firstName + " " + lastName;
        let data = new ChangeNameDto(newName);
        const response = await api.put("/profile/name", data);
        localStorage.setItem("username", newName);
        return response.data;
    } catch (error: unknown) {
        if (error instanceof Error) {
            throw error.message;
        } else {
            throw { message: "Network error" };
        }
    }
};