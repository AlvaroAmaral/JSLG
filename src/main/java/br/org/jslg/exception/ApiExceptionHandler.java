package br.org.jslg.exception;

import org.springframework.dao.DataIntegrityViolationException;
import br.org.jslg.service.AutenticacaoService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(RecursoNaoEncontradoException.class)
    public ResponseEntity<?> naoEncontrado(RuntimeException ex) { return resposta(HttpStatus.NOT_FOUND, ex.getMessage()); }
    @ExceptionHandler({RegraNegocioException.class, IllegalArgumentException.class})
    public ResponseEntity<?> regra(RuntimeException ex) { return resposta(HttpStatus.BAD_REQUEST, ex.getMessage()); }
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> validacao(MethodArgumentNotValidException ex) {
        Map<String, String> erros = new LinkedHashMap<>();
        for (FieldError erro : ex.getBindingResult().getFieldErrors()) erros.putIfAbsent(erro.getField(), erro.getDefaultMessage());
        return ResponseEntity.badRequest().body(Map.of("timestamp", Instant.now(), "status", 400, "erro", "Dados inválidos", "detalhes", erros));
    }
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<?> conflito(DataIntegrityViolationException ex) { return resposta(HttpStatus.CONFLICT, "O registro viola uma restrição de unicidade ou possui vínculos existentes."); }
    private ResponseEntity<?> resposta(HttpStatus status, String mensagem) {
        return ResponseEntity.status(status).body(Map.of("timestamp", Instant.now(), "status", status.value(), "erro", mensagem));
    }
    @ExceptionHandler(AutenticacaoService.CredenciaisInvalidasException.class)
    public ResponseEntity<?> credenciaisInvalidas(RuntimeException ex) { return resposta(HttpStatus.UNAUTHORIZED, "Usuário ou senha inválidos."); }
}
