using System.Security.Cryptography;
using Microsoft.AspNetCore.Cryptography.KeyDerivation;

namespace MeetVerse.Api.Services;

public class PasswordHasher : IPasswordHasher
{
    public string Hash(string password)
    {
        byte[] salt = RandomNumberGenerator.GetBytes(16);
        byte[] subkey = KeyDerivation.Pbkdf2(
            password,
            salt,
            KeyDerivationPrf.HMACSHA256,
            iterationCount: 100_000,
            numBytesRequested: 32);

        var outputBytes = new byte[1 + salt.Length + subkey.Length];
        outputBytes[0] = 0x01;
        Buffer.BlockCopy(salt, 0, outputBytes, 1, salt.Length);
        Buffer.BlockCopy(subkey, 0, outputBytes, 1 + salt.Length, subkey.Length);
        return Convert.ToBase64String(outputBytes);
    }

    public bool Verify(string hash, string password)
    {
        var decoded = Convert.FromBase64String(hash);
        if (decoded[0] != 0x01) return false;

        var salt = new byte[16];
        Buffer.BlockCopy(decoded, 1, salt, 0, salt.Length);
        var storedSubkey = new byte[32];
        Buffer.BlockCopy(decoded, 1 + salt.Length, storedSubkey, 0, storedSubkey.Length);

        var generatedSubkey = KeyDerivation.Pbkdf2(
            password,
            salt,
            KeyDerivationPrf.HMACSHA256,
            iterationCount: 100_000,
            numBytesRequested: 32);

        return CryptographicOperations.FixedTimeEquals(storedSubkey, generatedSubkey);
    }
}


