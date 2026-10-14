package br.org.jslg;

import br.org.jslg.domain.Evento;
import br.org.jslg.domain.Membro;
import br.org.jslg.domain.Presenca;
import br.org.jslg.domain.PapelCoordenador;
import br.org.jslg.config.JwtService;
import br.org.jslg.dto.MembroRequest;
import br.org.jslg.dto.MembroResponse;
import br.org.jslg.exception.RegraNegocioException;
import br.org.jslg.repository.EventoRepository;
import br.org.jslg.repository.MembroRepository;
import br.org.jslg.repository.PresencaRepository;
import br.org.jslg.repository.CoordenadorRepository;
import br.org.jslg.service.MembroService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.LocalDateTime;
import java.util.UUID;

import io.restassured.http.ContentType;
import io.restassured.response.Response;

import static io.restassured.RestAssured.given;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
        "app.security.admin-username=integration-master",
        "app.security.admin-password=IntegrationPassword123!",
        "app.security.jwt-secret=0123456789abcdef0123456789abcdef"
})
@Testcontainers
class JslgApplicationTests {

    @LocalServerPort int port;

    @Autowired MembroService membros;
    @Autowired MembroRepository membroRepository;
    @Autowired EventoRepository eventoRepository;
    @Autowired PresencaRepository presencaRepository;
    @Autowired CoordenadorRepository coordenadorRepository;
    @Autowired JwtService jwtService;

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

    @DynamicPropertySource
    static void props(DynamicPropertyRegistry r) {
        r.add("spring.datasource.url", postgres::getJdbcUrl);
        r.add("spring.datasource.username", postgres::getUsername);
        r.add("spring.datasource.password", postgres::getPassword);
    }

    @Test
    void contextoSobeEMigracoesRodam() {
    }

    @Test
    void criarRecusaMembroComDadosDuplicadosMesmoComVariacoesDeFormato() {
        String sufixo = UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        String nome = "Teste Duplicado " + sufixo;
        String instagram = "membro_" + sufixo;
        membros.criar(new MembroRequest(nome, "@" + instagram, "(11) 98765-4321"));

        RegraNegocioException erro = assertThrows(RegraNegocioException.class, () ->
                membros.criar(new MembroRequest(nome.toLowerCase(), instagram, "11987654321")));

        assertEquals("J\u00e1 existe um membro com esses mesmos dados.", erro.getMessage());
    }

    @Test
    void excluirMembroComPresencaMostraMensagemEPreservaHistorico() {
        String sufixo = UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        MembroResponse membro = membros.criar(new MembroRequest("Teste Presenca " + sufixo, null, null));

        Evento evento = new Evento();
        evento.setTitulo("Evento de teste " + sufixo);
        evento.setDataHora(LocalDateTime.now());
        evento.setLocal("Local de teste");
        evento = eventoRepository.saveAndFlush(evento);

        Presenca presenca = new Presenca();
        presenca.setMembro(membroRepository.findById(membro.id()).orElseThrow());
        presenca.setEvento(evento);
        presencaRepository.saveAndFlush(presenca);

        RegraNegocioException erro = assertThrows(RegraNegocioException.class, () -> membros.excluir(membro.id()));

        assertEquals("N\u00e3o \u00e9 poss\u00edvel remover este membro porque existem presen\u00e7as vinculadas. O hist\u00f3rico dos eventos foi preservado.", erro.getMessage());
        assertTrue(membroRepository.existsById(membro.id()));
        assertTrue(presencaRepository.existsByMembroId(membro.id()));
    }

    @Test
    void apiRecusaCriacaoDeMembroDuplicado() {
        String token = tokenDeAcesso();
        String sufixo = UUID.randomUUID().toString().replace("-", "").substring(0, 10);
        String nome = "API Duplicado " + sufixo;
        String instagram = "api_" + sufixo;

        given().port(port).auth().oauth2(token).contentType(ContentType.JSON)
                .body("{\"nome\":\"%s\",\"instagram\":\"@%s\",\"telefone\":\"(11) 98765-4321\"}".formatted(nome, instagram))
                .when().post("/api/membros").then().statusCode(201);

        given().port(port).auth().oauth2(token).contentType(ContentType.JSON)
                .body("{\"nome\":\"%s\",\"instagram\":\"%s\",\"telefone\":\"11987654321\"}".formatted(nome.toLowerCase(), instagram))
                .when().post("/api/membros").then().statusCode(400)
                .body("erro", org.hamcrest.Matchers.equalTo("J\u00e1 existe um membro com esses mesmos dados."));
    }

    @Test
    void apiImpedeExclusaoDeMembroComPresencaEInformaMotivo() {
        String token = tokenDeAcesso();
        MembroResponse membro = membros.criar(new MembroRequest("API Presenca " + UUID.randomUUID(), null, null));
        Evento evento = new Evento();
        evento.setTitulo("Evento API " + UUID.randomUUID());
        evento.setDataHora(LocalDateTime.now());
        evento.setLocal("Local de teste");
        evento = eventoRepository.saveAndFlush(evento);
        Presenca presenca = new Presenca();
        presenca.setMembro(membroRepository.findById(membro.id()).orElseThrow());
        presenca.setEvento(evento);
        presencaRepository.saveAndFlush(presenca);

        given().port(port).auth().oauth2(token)
                .when().delete("/api/membros/{id}", membro.id())
                .then().statusCode(400)
                .body("erro", org.hamcrest.Matchers.containsString("existem presen\u00e7as vinculadas"));

        assertTrue(membroRepository.existsById(membro.id()));
    }

    @Test
    void apiRecusaLoginComSenhaIncorreta() {
        given().port(port).contentType(ContentType.JSON)
                .body("{\"usuario\":\"integration-master\",\"senha\":\"senha-incorreta\"}")
                .when().post("/api/auth/login").then().statusCode(401)
                .body("erro", org.hamcrest.Matchers.containsString("inv\u00e1lidos"));
    }

    @Test
    void apiRecusaTokenInvalido() {
        given().port(port).header("Authorization", "Bearer token-invalido")
                .when().get("/api/membros").then().statusCode(401);
    }

    @Test
    void apiLimitaAdministracaoDeCoordenadoresAoPapelMaster() {
        String master = tokenDeAcesso();
        given().port(port).auth().oauth2(master).contentType(ContentType.JSON)
                .body("{\"usuario\":\"coord_teste\",\"senha\":\"SenhaForte123!\"}")
                .when().post("/api/coordenadores").then().statusCode(200);
        String coordenador = tokenPara("coord_teste", "SenhaForte123!");
        JwtService.Identidade identidade = jwtService.validar(coordenador);
        assertNotNull(identidade);
        assertEquals(PapelCoordenador.COORDENADOR, identidade.papel());
        var conta = coordenadorRepository.findByUsuarioIgnoreCaseAndAtivoTrue("coord_teste").orElseThrow();
        assertEquals(conta.getVersaoToken(), identidade.versaoToken());

        given().port(port).auth().oauth2(coordenador)
                .when().get("/api/coordenadores").then().statusCode(401);
    }

    @Test
    void apiValidaCamposObrigatoriosDeMembroEEvento() {
        String token = tokenDeAcesso();
        given().port(port).auth().oauth2(token).contentType(ContentType.JSON)
                .body("{\"nome\":\" \"}")
                .when().post("/api/membros").then().statusCode(400)
                .body("detalhes.nome", org.hamcrest.Matchers.equalTo("Informe o nome completo."));

        given().port(port).auth().oauth2(token).contentType(ContentType.JSON)
                .body("{\"titulo\":\" \"}")
                .when().post("/api/eventos").then().statusCode(400)
                .body("detalhes.titulo", org.hamcrest.Matchers.notNullValue());
    }

    @Test
    void apiImpedePresencaDuplicadaEExibeHistoricoDoMembro() {
        String token = tokenDeAcesso();
        String sufixo = UUID.randomUUID().toString().substring(0, 8);
        Number membroIdResposta = given().port(port).auth().oauth2(token).contentType(ContentType.JSON)
                .body("{\"nome\":\"Presenca " + sufixo + "\"}")
                .when().post("/api/membros").then().statusCode(201).extract().path("id");
        Long membroId = membroIdResposta.longValue();
        Number eventoIdResposta = given().port(port).auth().oauth2(token).contentType(ContentType.JSON)
                .body("{\"titulo\":\"Evento " + sufixo + "\",\"dataHora\":\"2027-11-01T10:00:00\",\"local\":\"Sede\"}")
                .when().post("/api/eventos").then().statusCode(201).extract().path("id");
        Long eventoId = eventoIdResposta.longValue();

        given().port(port).auth().oauth2(token).contentType(ContentType.JSON)
                .body("{\"membroId\":" + membroId + "}")
                .when().post("/api/eventos/{id}/presencas", eventoId).then().statusCode(201);
        given().port(port).auth().oauth2(token).contentType(ContentType.JSON)
                .body("{\"membroId\":" + membroId + "}")
                .when().post("/api/eventos/{id}/presencas", eventoId).then().statusCode(400)
                .body("erro", org.hamcrest.Matchers.containsString("presen\u00e7a"));

        given().port(port).auth().oauth2(token)
                .when().get("/api/membros/{id}/presencas", membroId).then().statusCode(200)
                .body("size()", org.hamcrest.Matchers.equalTo(1));
    }

    @Test
    void apiPermiteCancelarEventoCriado() {
        String token = tokenDeAcesso();
        Number eventoIdResposta = given().port(port).auth().oauth2(token).contentType(ContentType.JSON)
                .body("{\"titulo\":\"Evento cancelavel " + UUID.randomUUID() + "\",\"dataHora\":\"2027-11-01T10:00:00\",\"local\":\"Sede\"}")
                .when().post("/api/eventos").then().statusCode(201).extract().path("id");
        Long eventoId = eventoIdResposta.longValue();

        given().port(port).auth().oauth2(token).contentType(ContentType.JSON)
                .body("{\"titulo\":\"Evento atualizado\",\"dataHora\":\"2027-11-02T11:00:00\",\"local\":\"Outro local\"}")
                .when().put("/api/eventos/{id}", eventoId).then().statusCode(200)
                .body("titulo", org.hamcrest.Matchers.equalTo("Evento atualizado"));

        given().port(port).auth().oauth2(token)
                .when().patch("/api/eventos/{id}/cancelamento", eventoId).then().statusCode(200)
                .body("cancelado", org.hamcrest.Matchers.equalTo(true));
    }

    private String tokenDeAcesso() {
        return tokenPara("integration-master", "IntegrationPassword123!");
    }

    private String tokenPara(String usuario, String senha) {
        Response resposta = given().port(port).contentType(ContentType.JSON)
                .body("{\"usuario\":\"%s\",\"senha\":\"%s\"}".formatted(usuario, senha))
                .when().post("/api/auth/login").then().statusCode(200).extract().response();
        return resposta.path("token");
    }
}
