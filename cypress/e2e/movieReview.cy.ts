describe('영화 리뷰 E2E 테스트', () => {
  beforeEach(() => {
    cy.viewport(1920, 1080);
    cy.visit('/');
  });

  context('페이지 방문 테스트', () => {
    it('처음 페이지를 방문하면 스켈레톤 UI가 표시되어야 한다.', () => {
      cy.get('.item-list .item-card').should('have.id', 'item-card-skeleton');
    });

    it('403 에러가 발생했을 때, "다시 시도하기" 모달이 표시되어야 한다.', () => {
      cy.generateAPIKeyError();

      cy.visit('/');
      cy.wait('@APIKeyError');

      cy.get('#error-modal').should('exist');
    });
  });

  context('인기순 영화 목록 확인 테스트', () => {
    it('영화 목록 API 요청에 성공하면 20개의 영화 정보가 목록에 나열되어야 한다.', () => {
      cy.get('.item-list > li').should('have.length', 20);
    });

    it('스크롤을 아래로 내리면 20개의 영화 정보가 추가로 불러와져야 한다.', () => {
      cy.scrollTo(0, 9999999);
      cy.wait(1000);

      cy.get('.item-list > li').should('have.length', 40);
    });
  });

  context('검색 결과 확인 테스트', () => {
    it('검색어를 입력하지 않으면 에러 토스트 메시지가 표시되어야 한다.', () => {
      cy.get('#search-form').submit();

      cy.get('.toast').should('exist');
    });

    it('검색 결과가 없으면 "텅" 이미지가 표시되고 더보기 버튼이 없어야 한다.', () => {
      cy.searchMovie('ㅋㅋ');

      cy.get('#movie-list-container > img').should('exist');
      cy.get('#more-button').should('not.exist');
    });

    it('검색어를 입력하면 검색된 영화가 표시되어야 한다.', () => {
      cy.searchMovie('쿵푸팬더');

      cy.get('.item-title').invoke('text').should('contains', '쿵푸팬더');
    });
  });
});
