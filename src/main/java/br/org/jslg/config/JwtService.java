package br.org.jslg.config;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import br.org.jslg.domain.PapelCoordenador;

@Service
public class JwtService {
    private static final Base64.Encoder ENCODER = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder DECODER = Base64.getUrlDecoder();
    private final byte[] secret;
    private final Duration expiration;
    private final ObjectMapper mapper;

    public JwtService(@Value("${app.security.jwt-secret}") String secret,
                      @Value("${app.security.jwt-expiration:PT8H}") Duration expiration,
                      ObjectMapper mapper) {
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
        if (this.secret.length < 32) throw new IllegalArgumentException("Configure JWT_SECRET com uma chave de pelo menos 32 bytes.");
        this.expiration = expiration;
        this.mapper = mapper;
    }

    public String emitir(String usuario, PapelCoordenador papel, int versaoToken) {
        Instant agora = Instant.now();
        try {
            String cabecalho = ENCODER.encodeToString(mapper.writeValueAsBytes(Map.of("alg", "HS256", "typ", "JWT")));
            String corpo = ENCODER.encodeToString(mapper.writeValueAsBytes(Map.of("sub", usuario, "iat", agora.getEpochSecond(), "exp", agora.plus(expiration).getEpochSecond(), "role", papel.name(), "ver", versaoToken)));
            String assinado = cabecalho + "." + corpo;
            return assinado + "." + ENCODER.encodeToString(hmac(assinado));
        } catch (Exception e) { throw new IllegalStateException("Não foi possível emitir o token.", e); }
    }

    public Identidade validar(String token) {
        try {
            String[] partes = token.split("\\.");
            if (partes.length != 3) return null;
            String assinado = partes[0] + "." + partes[1];
            if (!java.security.MessageDigest.isEqual(hmac(assinado), DECODER.decode(partes[2]))) return null;
            Map<String, Object> claims = mapper.readValue(DECODER.decode(partes[1]), new TypeReference<>() { });
            if (!(claims.get("exp") instanceof Number exp) || exp.longValue() <= Instant.now().getEpochSecond()) return null;
            if (!(claims.get("sub") instanceof String usuario)) return null;
            if (!(claims.get("role") instanceof String papel)) return null;
            if (!papel.equals(PapelCoordenador.MASTER.name()) && !papel.equals(PapelCoordenador.COORDENADOR.name())) return null;
            Object versaoClaim = claims.get("ver");
            // Tokens emitidos antes da migração V7 não tinham a claim "ver".
            // A migração inicia todas as contas em 0; mudanças de senha elevam
            // a versão e continuam revogando apenas as sessões da conta editada.
            if (versaoClaim == null && !claims.containsKey("ver")) {
                return new Identidade(usuario, PapelCoordenador.valueOf(papel), 0);
            }
            if (!(versaoClaim instanceof Number ver)) return null;
            return new Identidade(usuario, PapelCoordenador.valueOf(papel), ver.intValue());
        } catch (Exception ignored) { return null; }
    }

    public record Identidade(String usuario, PapelCoordenador papel, int versaoToken) { }

    public Instant expiraEm() { return Instant.now().plus(expiration); }
    private byte[] hmac(String mensagem) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret, "HmacSHA256"));
        return mac.doFinal(mensagem.getBytes(StandardCharsets.UTF_8));
    }
}
