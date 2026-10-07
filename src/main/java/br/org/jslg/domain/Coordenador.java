package br.org.jslg.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "coordenador")
public class Coordenador {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 80)
    private String usuario;

    @Column(name = "senha_hash", nullable = false, length = 100)
    private String senhaHash;

    @Column(nullable = false)
    private boolean ativo = true;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PapelCoordenador papel = PapelCoordenador.COORDENADOR;

    @Column(name = "versao_token", nullable = false)
    private int versaoToken = 0;

    public Coordenador() { }
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getUsuario() { return usuario; }
    public void setUsuario(String usuario) { this.usuario = usuario; }
    public String getSenhaHash() { return senhaHash; }
    public void setSenhaHash(String senhaHash) { this.senhaHash = senhaHash; }
    public boolean isAtivo() { return ativo; }
    public void setAtivo(boolean ativo) { this.ativo = ativo; }
    public PapelCoordenador getPapel() { return papel; }
    public void setPapel(PapelCoordenador papel) { this.papel = papel; }
    public int getVersaoToken() { return versaoToken; }
    public void setVersaoToken(int versaoToken) { this.versaoToken = versaoToken; }
}
